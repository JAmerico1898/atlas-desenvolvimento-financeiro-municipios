"""
Dimension calculations D1–D5 for ADFM indicators.

Input: panel DataFrame from pipeline/transform/panel.py
Output: same DataFrame with new indicator columns added.
"""

import numpy as np
import pandas as pd

from .utils import winsorize, safe_ratio


def compute_d1(df: pd.DataFrame) -> pd.DataFrame:
    """D1 — Acesso físico."""
    df = df.copy()

    # dens_agencias = num_agencias / pop_total * 10000
    df["dens_agencias"] = safe_ratio(df["num_agencias"].astype(float), df["pop_total"].astype(float)) * 10_000

    # dens_pontos = (num_agencias + num_postos) / pop_total * 10000 (winsor p99.5)
    pontos_total = df["num_agencias"].astype(float) + df["num_postos"].astype(float)
    df["dens_pontos"] = winsorize(safe_ratio(pontos_total, df["pop_total"].astype(float)) * 10_000, p=(0.005, 0.995))

    # deserto_bancario_flag = 1 if (num_agencias + num_postos) == 0
    df["deserto_bancario_flag"] = ((df["num_agencias"] + df["num_postos"]) == 0).astype(int)

    # hab_por_ponto = 10000 / dens_pontos
    df["hab_por_ponto"] = safe_ratio(pd.Series(10_000.0, index=df.index), df["dens_pontos"])

    return df


def compute_d2(df: pd.DataFrame) -> pd.DataFrame:
    """D2 — Profundidade e uso."""
    df = df.copy()

    # depositos_total = dep_vista + dep_poupanca + dep_prazo
    df["depositos_total"] = df["dep_vista"] + df["dep_poupanca"] + df["dep_prazo"]

    # credito_pc = saldo_credito / pop_total (winsor p99.5)
    df["credito_pc"] = winsorize(safe_ratio(df["saldo_credito"], df["pop_total"].astype(float)), p=(0.005, 0.995))

    # deposito_pc = depositos_total / pop_total (winsor p99.5)
    df["deposito_pc"] = winsorize(safe_ratio(df["depositos_total"], df["pop_total"].astype(float)), p=(0.005, 0.995))

    # profundidade_pib = (saldo_credito + depositos_total) / pib (winsor p99.5)
    df["profundidade_pib"] = winsorize(safe_ratio(df["saldo_credito"] + df["depositos_total"], df["pib"]), p=(0.005, 0.995))

    # credito_pib = saldo_credito / pib (winsor p99.5)
    df["credito_pib"] = winsorize(safe_ratio(df["saldo_credito"], df["pib"]), p=(0.005, 0.995))

    # irpb = credito_pib / credito_pib_nacional
    # credito_pib_nacional = sum(credito) / sum(pib) per ponto
    total_credito = df.groupby("ponto")["saldo_credito"].transform("sum")
    total_pib = df.groupby("ponto")["pib"].transform("sum")
    nacional_ratio = total_credito / total_pib.replace(0, np.nan)
    df["irpb"] = df["credito_pib"] / nacional_ratio

    return df


def compute_d3(df: pd.DataFrame) -> pd.DataFrame:
    """D3 — Intermediação e retenção."""
    df = df.copy()

    # rcd = saldo_credito / depositos_total (winsor p99.5; NULL if depositos_total == 0)
    df["rcd"] = winsorize(safe_ratio(df["saldo_credito"], df["depositos_total"]), p=(0.005, 0.995))

    # sli_pc = (saldo_credito - depositos_total) / pop_total (winsor p99.5)
    df["sli_pc"] = winsorize(safe_ratio(df["saldo_credito"] - df["depositos_total"], df["pop_total"].astype(float)), p=(0.005, 0.995))

    # irf = 1 - abs(credito - deposito) / (credito + deposito); limited to [0,1]; NULL if both 0
    soma = df["saldo_credito"] + df["depositos_total"]
    diff = (df["saldo_credito"] - df["depositos_total"]).abs()
    irf_raw = 1 - safe_ratio(diff, soma)
    df["irf"] = irf_raw.clip(lower=0, upper=1)

    return df


def compute_d4(df: pd.DataFrame) -> pd.DataFrame:
    """D4 — Digitalização (nullable — PIX may be missing)."""
    df = df.copy()

    # pix_tx_pc = pix_qtd_transacoes / pop_total (winsor p99.5 para remover outlier extremo)
    df["pix_tx_pc"] = winsorize(safe_ratio(df["pix_qtd_transacoes"], df["pop_total"].astype(float)), p=(0.005, 0.995))

    # pix_val_pib = pix_valor / pib
    df["pix_val_pib"] = safe_ratio(df["pix_valor"], df["pib"])

    # valor_pix_pc = pix_valor / pop_total (used in IMB)
    df["valor_pix_pc"] = safe_ratio(df["pix_valor"], df["pop_total"].astype(float))

    return df


def compute_d5_relative(df: pd.DataFrame) -> pd.DataFrame:
    """D5 — Desigualdade relativa."""
    df = df.copy()

    # irc = credito_pc / mean(credito_pc) per ponto
    df["irc"] = df.groupby("ponto")["credito_pc"].transform(lambda x: x / x.mean())

    # ird = deposito_pc / mean(deposito_pc) per ponto
    df["ird"] = df.groupby("ponto")["deposito_pc"].transform(lambda x: x / x.mean())

    return df


def compute_dimensions(df: pd.DataFrame) -> pd.DataFrame:
    """Apply D1–D5."""
    df = compute_d1(df)
    df = compute_d2(df)
    df = compute_d3(df)
    df = compute_d4(df)
    df = compute_d5_relative(df)
    return df
