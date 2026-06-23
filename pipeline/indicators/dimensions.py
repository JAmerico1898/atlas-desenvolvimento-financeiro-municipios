"""
Dimension calculations D1–D5 for ADFM indicators.

Input: panel DataFrame from pipeline/transform/panel.py
Output: same DataFrame with new indicator columns added.
"""

import numpy as np
import pandas as pd
from scipy import stats

from .utils import winsorize, safe_ratio, log_transform, zscore


def compute_d1(df: pd.DataFrame) -> pd.DataFrame:
    """D1 — Acesso físico."""
    df = df.copy()

    # dens_agencias = num_agencias / pop_total * 10000
    df["dens_agencias"] = safe_ratio(df["num_agencias"].astype(float), df["pop_total"].astype(float)) * 10_000

    # dens_pontos = (num_agencias + num_postos + num_paes) / pop_total * 10000, winsor p99
    pontos_total = df["num_agencias"].astype(float) + df["num_postos"].astype(float) + df["num_paes"].astype(float)
    dens_pontos_raw = safe_ratio(pontos_total, df["pop_total"].astype(float)) * 10_000
    df["dens_pontos"] = winsorize(dens_pontos_raw, p=(0.01, 0.99))

    # deserto_bancario_flag = 1 if (num_agencias + num_postos) == 0
    df["deserto_bancario_flag"] = ((df["num_agencias"] + df["num_postos"]) == 0).astype(int)

    # hab_por_ponto = pop_total / (num_agencias + num_postos); NULL if denominator == 0, winsor p99
    den_pontos = (df["num_agencias"] + df["num_postos"]).astype(float)
    hab_por_ponto_raw = safe_ratio(df["pop_total"].astype(float), den_pontos)
    df["hab_por_ponto"] = winsorize(hab_por_ponto_raw, p=(0.01, 0.99))

    return df


def compute_d2(df: pd.DataFrame) -> pd.DataFrame:
    """D2 — Profundidade e uso."""
    df = df.copy()

    # depositos_total = dep_vista + dep_poupanca + dep_prazo
    df["depositos_total"] = df["dep_vista"] + df["dep_poupanca"] + df["dep_prazo"]

    # credito_pc = saldo_credito / pop_total (log, winsor)
    credito_pc_raw = safe_ratio(df["saldo_credito"], df["pop_total"].astype(float))
    df["credito_pc"] = winsorize(log_transform(credito_pc_raw))

    # deposito_pc = depositos_total / pop_total (log, winsor)
    deposito_pc_raw = safe_ratio(df["depositos_total"], df["pop_total"].astype(float))
    df["deposito_pc"] = winsorize(log_transform(deposito_pc_raw))

    # profundidade_pib = (saldo_credito + depositos_total) / pib (winsor)
    profund_raw = safe_ratio(df["saldo_credito"] + df["depositos_total"], df["pib"])
    df["profundidade_pib"] = winsorize(profund_raw)

    # credito_pib = saldo_credito / pib (winsor)
    credito_pib_raw = safe_ratio(df["saldo_credito"], df["pib"])
    df["credito_pib"] = winsorize(credito_pib_raw)

    # irpb = credito_pib / credito_pib_nacional
    # credito_pib_nacional computed per ponto as aggregate sum(credito) / sum(pib)
    def _irpb(group: pd.DataFrame) -> pd.Series:
        total_credito = group["saldo_credito"].sum()
        total_pib = group["pib"].sum()
        if total_pib == 0 or pd.isna(total_pib):
            return pd.Series(np.nan, index=group.index)
        nacional = total_credito / total_pib
        return group["credito_pib"] / nacional if nacional != 0 else pd.Series(np.nan, index=group.index)

    df["irpb"] = df.groupby("ponto", group_keys=False).apply(_irpb)

    return df


def compute_d3(df: pd.DataFrame) -> pd.DataFrame:
    """D3 — Intermediação e retenção."""
    df = df.copy()

    # rcd = saldo_credito / depositos_total (winsor; NULL if depositos_total == 0)
    rcd_raw = safe_ratio(df["saldo_credito"], df["depositos_total"])
    df["rcd"] = winsorize(rcd_raw)

    # sli_pc = (saldo_credito - depositos_total) / pop_total (winsor)
    sli_raw = safe_ratio(df["saldo_credito"] - df["depositos_total"], df["pop_total"].astype(float))
    df["sli_pc"] = winsorize(sli_raw)

    # irf = 1 - abs(credito - deposito) / (credito + deposito); limited to [0,1]; NULL if both 0
    soma = df["saldo_credito"] + df["depositos_total"]
    diff = (df["saldo_credito"] - df["depositos_total"]).abs()
    irf_raw = 1 - safe_ratio(diff, soma)
    df["irf"] = irf_raw.clip(lower=0, upper=1)

    return df


def compute_d4(df: pd.DataFrame) -> pd.DataFrame:
    """D4 — Digitalização (nullable — PIX may be missing)."""
    df = df.copy()

    # pix_tx_pc = pix_qtd_transacoes / pop_total
    df["pix_tx_pc"] = safe_ratio(df["pix_qtd_transacoes"], df["pop_total"].astype(float))

    # pix_val_pib = pix_valor / pib
    df["pix_val_pib"] = safe_ratio(df["pix_valor"], df["pib"])

    # valor_pix_pc = pix_valor / pop_total (used in IMB)
    df["valor_pix_pc"] = safe_ratio(df["pix_valor"], df["pop_total"].astype(float))

    return df


def compute_d5_relative(df: pd.DataFrame) -> pd.DataFrame:
    """
    D5 — Desigualdade relativa (irc and ird only).
    resid_imb_idhm is computed after IMB is available; call compute_d5_residuals() later.
    """
    df = df.copy()

    # irc = credito_pc / mean(credito_pc) per ponto
    df["irc"] = df.groupby("ponto")["credito_pc"].transform(lambda x: x / x.mean())

    # ird = deposito_pc / mean(deposito_pc) per ponto
    df["ird"] = df.groupby("ponto")["deposito_pc"].transform(lambda x: x / x.mean())

    return df


def compute_d5_residuals(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute resid_imb_idhm: OLS residual of imb ~ ifdm.
    Call AFTER imb column has been added by compute_indices().
    """
    df = df.copy()

    mask = df["imb"].notna() & df["ifdm"].notna()
    resid = pd.Series(np.nan, index=df.index)

    if mask.sum() >= 2:
        x = df.loc[mask, "ifdm"].values
        y = df.loc[mask, "imb"].values
        slope, intercept, *_ = stats.linregress(x, y)
        fitted = intercept + slope * x
        resid.loc[mask[mask].index] = y - fitted

    df["resid_imb_idhm"] = resid
    return df


def compute_dimensions(df: pd.DataFrame) -> pd.DataFrame:
    """Apply D1–D5 (excluding resid_imb_idhm which needs IMB)."""
    df = compute_d1(df)
    df = compute_d2(df)
    df = compute_d3(df)
    df = compute_d4(df)
    df = compute_d5_relative(df)
    return df
