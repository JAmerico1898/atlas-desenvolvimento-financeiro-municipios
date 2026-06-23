import logging

import pandas as pd

from .canais import load_paes, load_postos
from .estban import load_agencias, load_saldos
from .ibge import load_pib, load_populacao
from .ifdm import load_ifdm
from .pix import load_pix

logger = logging.getLogger(__name__)


def build_panel(data_dir, db_path, points: dict) -> pd.DataFrame:
    logger.info("Loading ESTBAN saldos...")
    saldos = load_saldos(data_dir)
    logger.info("Loading ESTBAN agencias...")
    agencias = load_agencias(data_dir)
    logger.info("Loading PIX...")
    pix = load_pix(db_path, points)
    logger.info("Loading IBGE population...")
    pop = load_populacao(data_dir)
    logger.info("Loading IBGE PIB...")
    pib = load_pib(data_dir)
    logger.info("Loading postos...")
    postos = load_postos(data_dir)
    logger.info("Loading PAEs...")
    paes = load_paes(data_dir)
    logger.info("Loading IFDM...")
    ifdm = load_ifdm(data_dir)

    target_months = set(points.values())
    month_to_ponto = {v: k for k, v in points.items()}
    ponto_to_month = {k: v for k, v in points.items()}

    # Anchor: ALL municipalities from population file × 3 pontos
    # Municipalities without ESTBAN are banking deserts (num_agencias=0, saldos=0)
    all_munis = pop[["municipio_id"]].drop_duplicates()
    anchor = pd.DataFrame(
        [(m, p) for m in all_munis["municipio_id"] for p in points.keys()],
        columns=["municipio_id", "ponto"],
    )
    anchor["data_ref_estban"] = anchor["ponto"].map(ponto_to_month)

    # ESTBAN saldos filtered to the 3 time points
    saldos_filt = saldos[saldos["data_base"].isin(target_months)].copy()
    saldos_filt["ponto"] = saldos_filt["data_base"].map(month_to_ponto)
    saldos_filt = saldos_filt.drop(columns=["data_base"])

    # Agencias: same month filter
    ag = agencias[agencias["data_base"].isin(target_months)].copy()
    ag["ponto"] = ag["data_base"].map(month_to_ponto)
    ag = ag.drop(columns=["data_base"])

    # Postos: same month filter
    pos = postos[postos["data_base"].isin(target_months)].copy()
    pos["ponto"] = pos["data_base"].map(month_to_ponto)
    pos = pos.drop(columns=["data_base"])

    # PAEs: same month filter
    pae = paes[paes["data_base"].isin(target_months)].copy()
    pae["ponto"] = pae["data_base"].map(month_to_ponto)
    pae = pae.drop(columns=["data_base"])

    panel = anchor.merge(saldos_filt, on=["municipio_id", "ponto"], how="left")
    panel = panel.merge(ag, on=["municipio_id", "ponto"], how="left")
    panel = panel.merge(pix, on=["municipio_id", "ponto"], how="left")
    panel = panel.merge(pop, on="municipio_id", how="left")
    panel = panel.merge(pib, on="municipio_id", how="left")
    panel = panel.merge(pos, on=["municipio_id", "ponto"], how="left")
    panel = panel.merge(pae, on=["municipio_id", "ponto"], how="left")
    panel = panel.merge(ifdm, on="municipio_id", how="left")

    # Banking deserts: fill 0 for ESTBAN monetary/count columns
    estban_cols = ["saldo_credito", "dep_vista", "dep_poupanca", "dep_prazo", "num_agencias"]
    panel[estban_cols] = panel[estban_cols].fillna(0)
    panel[["num_postos", "num_paes"]] = panel[["num_postos", "num_paes"]].fillna(0)

    panel["data_ref_pix"] = panel["ponto"].map(ponto_to_month)

    col_order = [
        "municipio_id", "ponto", "data_ref_estban", "data_ref_pix",
        "saldo_credito", "dep_vista", "dep_poupanca", "dep_prazo", "num_agencias",
        "pix_qtd_transacoes", "pix_valor",
        "pop_total", "pib",
        "num_postos", "num_paes",
        "ifdm", "ifdm_emprego_renda",
    ]
    panel = panel[col_order]

    logger.info("Panel built: %s rows, %s municipalities", len(panel), panel["municipio_id"].nunique())
    return panel.reset_index(drop=True)
