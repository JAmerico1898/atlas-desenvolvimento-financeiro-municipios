import logging
import sqlite3

import pandas as pd

logger = logging.getLogger(__name__)


def _pad_mun(code) -> str:
    return str(int(float(code))).zfill(7)


def load_pix(db_path, points: dict) -> pd.DataFrame:
    conn = sqlite3.connect(db_path)
    available = pd.read_sql("SELECT DISTINCT AnoMes FROM pix_municipios ORDER BY AnoMes", conn)[
        "AnoMes"
    ].tolist()
    conn.close()

    resolved = {}
    for label, yyyymm in points.items():
        target = int(yyyymm)
        if target in available:
            resolved[label] = target
        else:
            # Use latest available month and warn
            fallback = max(m for m in available if m <= target) if any(m <= target for m in available) else max(available)
            logger.warning(
                "PIX month %s not found; using %s for point %s", yyyymm, fallback, label
            )
            resolved[label] = fallback

    frames = []
    conn = sqlite3.connect(db_path)
    for label, ano_mes in resolved.items():
        df = pd.read_sql(
            "SELECT Municipio_Ibge, QT_Total_Pagador, VL_PagadorPF, VL_PagadorPJ "
            "FROM pix_municipios WHERE AnoMes = ?",
            conn,
            params=(ano_mes,),
        )
        df = df.dropna(subset=["Municipio_Ibge"])
        df["municipio_id"] = df["Municipio_Ibge"].apply(_pad_mun)
        df["ponto"] = label
        df["pix_qtd_transacoes"] = df["QT_Total_Pagador"].astype(int)
        df["pix_valor"] = df["VL_PagadorPF"].fillna(0) + df["VL_PagadorPJ"].fillna(0)
        frames.append(
            df[["municipio_id", "ponto", "pix_qtd_transacoes", "pix_valor"]]
        )
    conn.close()

    return pd.concat(frames, ignore_index=True)
