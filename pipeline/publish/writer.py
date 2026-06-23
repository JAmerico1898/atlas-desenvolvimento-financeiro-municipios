"""
Transactional writer to Neon (Postgres) for ADFM pipeline.
"""

import json
import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import psycopg
from psycopg.rows import dict_row


# Indicator columns to include in fato_serie_3pontos (long format)
_SERIE_COLS = [
    "dens_agencias", "dens_pontos", "deserto_bancario", "hab_por_ponto",
    "credito_pc", "deposito_pc", "profundidade_pib", "credito_pib", "irpb",
    "rcd", "sli_pc", "irf", "pix_tx_pc", "pix_val_pib",
    "irc", "ird", "imb", "imdf",
]

# Hardcoded data source catalog
FONTE_VARIAVEL = [
    ("saldo_credito",        "ESTBAN/BCB", "estoque",  "mensal",    False),
    ("dep_vista",            "ESTBAN/BCB", "estoque",  "mensal",    False),
    ("dep_poupanca",         "ESTBAN/BCB", "estoque",  "mensal",    False),
    ("dep_prazo",            "ESTBAN/BCB", "estoque",  "mensal",    False),
    ("num_agencias",         "ESTBAN/BCB", "estoque",  "mensal",    False),
    ("pix_qtd_transacoes",   "Pix/BCB",   "fluxo",    "mensal",    True),
    ("pix_valor",            "Pix/BCB",   "fluxo",    "mensal",    True),
    ("num_postos",           "Canais/BCB","estoque",   "periódico", False),
    ("num_paes",             "Canais/BCB","estoque",   "periódico", False),
    ("pop_total",            "IBGE",      "-",         "anual",     False),
    ("pib",                  "IBGE",      "fluxo",     "anual",     False),
    ("ifdm",                 "Firjan",    "-",         "2023",      False),
    ("ifdm_emprego_renda",   "Firjan",    "-",         "2023",      False),
]

# Shapefile path (relative to project root)
_SHAPEFILE = Path(__file__).parent.parent.parent / "municipios-malha-territorial" / "BR_Municipios_2025.shp"

# FK-safe truncation order
_TRUNCATE_ORDER = [
    "fato_serie_3pontos",
    "fato_indicadores_municipio",
    "meta_imdf",
    "dim_cluster",
    "dim_municipio",
    "meta_fonte_variavel",
    "meta_dataset_version",
]


def _load_municipio_geo() -> pd.DataFrame:
    """
    Read BR_Municipios_2025 shapefile to get CD_MUN -> NM_MUN, SIGLA_UF, NM_REGIAO.
    Returns DataFrame with columns: municipio_id, nome, uf, regiao.
    """
    try:
        import geopandas as gpd
        gdf = gpd.read_file(str(_SHAPEFILE))[["CD_MUN", "NM_MUN", "SIGLA_UF", "NM_REGIAO"]]
    except Exception as e:
        raise RuntimeError(f"Failed to read shapefile at {_SHAPEFILE}: {e}")

    gdf = gdf.rename(columns={
        "CD_MUN": "municipio_id",
        "NM_MUN": "nome",
        "SIGLA_UF": "uf",
        "NM_REGIAO": "regiao",
    })
    # Pad CD_MUN to 7 digits (it may come as integer)
    gdf["municipio_id"] = gdf["municipio_id"].astype(str).str.zfill(7)
    return gdf[["municipio_id", "nome", "uf", "regiao"]]


def _scalar(val) -> Optional[float]:
    """Convert numpy scalar / NaN to Python scalar or None."""
    if val is None:
        return None
    if isinstance(val, float) and np.isnan(val):
        return None
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        v = float(val)
        return None if np.isnan(v) else v
    return val


def publish(
    df: pd.DataFrame,
    cluster_profiles: list,
    meta_indices: dict,
    versao: str,
    database_url: str,
) -> None:
    """
    Transactional write to Neon. All operations in a single transaction.
    """
    geo = _load_municipio_geo()

    # t0 snapshot
    t0 = df[df["ponto"] == "t0"].copy()

    with psycopg.connect(database_url) as conn:
        with conn.transaction():
            cur = conn.cursor()

            # 1. Truncate all tables (FK-safe order)
            for table in _TRUNCATE_ORDER:
                cur.execute(f"TRUNCATE TABLE {table} CASCADE")

            # 2. Insert dim_municipio
            dim_cols = ["municipio_id", "pop_total", "pib", "ifdm", "ifdm_emprego_renda"]
            t0_dim = t0[dim_cols].copy()
            t0_dim = t0_dim.merge(geo, on="municipio_id", how="left")

            # Fill missing geo info with placeholder
            t0_dim["nome"] = t0_dim["nome"].fillna(t0_dim["municipio_id"])
            t0_dim["uf"] = t0_dim["uf"].fillna("??")
            t0_dim["regiao"] = t0_dim["regiao"].fillna("Desconhecido")

            dim_rows = [
                (
                    row.municipio_id,
                    row.nome,
                    row.uf,
                    row.regiao,
                    None,   # lat — not in df; could enrich later
                    None,   # lon
                    _scalar(row.pop_total),
                    _scalar(row.pib),
                    None,   # ano_ref_pib
                    _scalar(row.ifdm),
                    _scalar(row.ifdm_emprego_renda),
                )
                for row in t0_dim.itertuples(index=False)
            ]
            cur.executemany(
                """INSERT INTO dim_municipio
                   (municipio_id, nome, uf, regiao, lat, lon,
                    pop_total, pib, ano_ref_pib, ifdm, ifdm_emprego_renda)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (municipio_id) DO NOTHING""",
                dim_rows,
            )

            # 3. Insert fato_indicadores_municipio (t0 only)
            deserto_col = "deserto_bancario_flag" if "deserto_bancario_flag" in t0.columns else "deserto_bancario"
            fato_rows = []
            for row in t0.itertuples(index=False):
                deserto_val = _scalar(getattr(row, deserto_col, None))
                fato_rows.append((
                    row.municipio_id,
                    getattr(row, "data_ref_estban", None),
                    getattr(row, "data_ref_pix", None),
                    _scalar(row.dens_agencias),
                    _scalar(row.dens_pontos),
                    int(deserto_val) if deserto_val is not None else None,
                    _scalar(row.hab_por_ponto),
                    _scalar(row.credito_pc),
                    _scalar(row.deposito_pc),
                    _scalar(row.profundidade_pib),
                    _scalar(row.credito_pib),
                    _scalar(row.irpb),
                    _scalar(row.rcd),
                    _scalar(row.sli_pc),
                    _scalar(row.irf),
                    _scalar(row.pix_tx_pc),
                    _scalar(row.pix_val_pib),
                    _scalar(row.irc),
                    _scalar(row.ird),
                    _scalar(getattr(row, "resid_imb_idhm", None)),
                    _scalar(row.imb),
                    _scalar(row.imdf),
                    _scalar(row.rank_imdf_nacional),
                    _scalar(getattr(row, "rank_imdf_uf", None)),
                    _scalar(getattr(row, "cluster_id", None)),
                ))

            cur.executemany(
                """INSERT INTO fato_indicadores_municipio
                   (municipio_id, data_ref_estban, data_ref_pix,
                    dens_agencias, dens_pontos, deserto_bancario, hab_por_ponto,
                    credito_pc, deposito_pc, profundidade_pib, credito_pib, irpb,
                    rcd, sli_pc, irf, pix_tx_pc, pix_val_pib,
                    irc, ird, resid_imb_idhm, imb, imdf,
                    rank_imdf_nacional, rank_imdf_uf, cluster_id)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   ON CONFLICT (municipio_id) DO NOTHING""",
                fato_rows,
            )

            # 4. Insert fato_serie_3pontos (long format, all pontos)
            serie_rows = []
            # Determine which indicator columns actually exist in df
            existing_serie_cols = [c for c in _SERIE_COLS if c in df.columns]
            for row in df.itertuples(index=False):
                mun_id = row.municipio_id
                ponto = row.ponto
                data_ref = getattr(row, "data_ref", None)
                for col in existing_serie_cols:
                    val = _scalar(getattr(row, col))
                    serie_rows.append((mun_id, ponto, data_ref, col, val))

            cur.executemany(
                """INSERT INTO fato_serie_3pontos
                   (municipio_id, ponto, data_ref, indicador, valor)
                   VALUES (%s, %s, %s, %s, %s)
                   ON CONFLICT (municipio_id, ponto, indicador) DO NOTHING""",
                serie_rows,
            )

            # 5. Insert dim_cluster
            cluster_rows = []
            for profile in cluster_profiles:
                perfil_json = json.dumps(profile.get("perfil", {}), ensure_ascii=False)
                cluster_rows.append((
                    profile["cluster_id"],
                    profile.get("rotulo"),
                    profile.get("n_municipios"),
                    perfil_json,
                ))
            if cluster_rows:
                cur.executemany(
                    """INSERT INTO dim_cluster (cluster_id, rotulo, n_municipios, perfil)
                       VALUES (%s, %s, %s, %s::jsonb)
                       ON CONFLICT (cluster_id) DO NOTHING""",
                    cluster_rows,
                )

            # 6. Insert meta_imdf
            meta_rows = []
            for indice_name, indice_meta in meta_indices.items():
                variaveis = indice_meta.get("variaveis", [])
                cargas = indice_meta.get("cargas", [])
                var_exp = indice_meta.get("variancia_exp")
                for i, variavel in enumerate(variaveis):
                    carga = cargas[i] if i < len(cargas) else None
                    meta_rows.append((
                        indice_name,
                        variavel,
                        _scalar(carga),
                        _scalar(var_exp),
                        versao,
                    ))
            if meta_rows:
                cur.executemany(
                    """INSERT INTO meta_imdf (indice, variavel, carga, variancia_exp, versao)
                       VALUES (%s, %s, %s, %s, %s)
                       ON CONFLICT (indice, variavel, versao) DO NOTHING""",
                    meta_rows,
                )

            # 7. Insert meta_fonte_variavel
            cur.executemany(
                """INSERT INTO meta_fonte_variavel
                   (variavel, fonte, natureza, periodicidade, verificar)
                   VALUES (%s, %s, %s, %s, %s)
                   ON CONFLICT (variavel) DO NOTHING""",
                FONTE_VARIAVEL,
            )

            # 8. Insert meta_dataset_version
            n_municipios = int(t0["municipio_id"].nunique())
            from pipeline.config import POINTS
            cur.execute(
                """INSERT INTO meta_dataset_version
                   (versao, data_exec, data_ref_t0, n_municipios, relabel_map, notas)
                   VALUES (%s, %s, %s, %s, %s::jsonb, %s)
                   ON CONFLICT (versao) DO NOTHING""",
                (
                    versao,
                    datetime.datetime.now(datetime.timezone.utc),
                    POINTS.get("t0"),
                    n_municipios,
                    json.dumps({}),
                    None,
                ),
            )
