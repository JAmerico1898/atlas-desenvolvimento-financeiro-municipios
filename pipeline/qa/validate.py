"""
QA validation for ADFM pipeline output DataFrame.
"""

import sys
import numpy as np
import pandas as pd


def validate(df: pd.DataFrame, cluster_profiles: list, meta_indices: dict) -> dict:
    """
    Runs all QA checks. Returns structured result:
    {
      "pass": bool,
      "checks": [{"name": str, "status": "pass"|"fail"|"warn", "detail": str}],
      "coverage": {"pix_pct_filled": float, ...}
    }
    Raises SystemExit(1) on critical failure.
    """
    checks = []
    critical_failed = False

    def add(name: str, status: str, detail: str):
        checks.append({"name": name, "status": status, "detail": detail})

    t0 = df[df["ponto"] == "t0"]

    # =========================================================================
    # BLOCO 0 — Estrutura e chaves (CRITICAL)
    # =========================================================================

    t0_muns = t0["municipio_id"].nunique()
    if abs(t0_muns - 5570) <= 50:
        add("cobertura_municipios", "pass", f"{t0_muns} municipalities at t0 (expected 5570 +/- 50)")
    else:
        add("cobertura_municipios", "fail", f"{t0_muns} municipalities at t0, expected 5570 +/- 50 -- CRITICAL")
        critical_failed = True

    null_ids = df["municipio_id"].isna().sum()
    if null_ids > 0:
        add("municipio_id_nulls", "fail", f"{null_ids} null municipio_id values -- CRITICAL")
        critical_failed = True
    else:
        add("municipio_id_nulls", "pass", "No null municipio_id values")

    bad_format = df["municipio_id"].dropna().astype(str).str.match(r"^\d{7}$").eq(False).sum()
    if bad_format > 0:
        add("municipio_id_format", "fail", f"{bad_format} municipio_id values not matching 7-digit pattern -- CRITICAL")
        critical_failed = True
    else:
        add("municipio_id_format", "pass", "All municipio_id values are 7-digit strings")

    dups = df.groupby("ponto")["municipio_id"].apply(lambda s: s.duplicated().sum()).sum()
    if dups > 0:
        add("municipio_id_duplicates", "fail", f"{dups} duplicate municipio_id per ponto -- CRITICAL")
        critical_failed = True
    else:
        add("municipio_id_duplicates", "pass", "No duplicate municipio_id within any ponto")

    add("uf_check", "warn", "SKIPPED -- UF lives in dim_municipio (shapefile); not available in indicators DataFrame")

    # =========================================================================
    # BLOCO A — Ranges por variavel
    # =========================================================================

    def check_non_negative(col: str):
        if col not in df.columns:
            add(f"{col}_range", "warn", f"Column '{col}' not found -- check skipped")
            return
        neg = (df[col] < 0).sum()
        if neg > 0:
            add(f"{col}_range", "warn", f"{neg} rows with {col} < 0")
        else:
            add(f"{col}_range", "pass", f"All {col} >= 0")

    def check_in_unit(col: str):
        if col not in df.columns:
            add(f"{col}_range", "warn", f"Column '{col}' not found -- check skipped")
            return
        out = df[col].dropna().between(0, 1).eq(False).sum()
        if out > 0:
            add(f"{col}_range", "warn", f"{out} rows with {col} outside [0, 1]")
        else:
            add(f"{col}_range", "pass", f"All {col} in [0, 1]")

    # D1
    check_non_negative("dens_agencias")
    check_non_negative("dens_pontos")

    if "pop_total" in df.columns:
        bad_pop = (df["pop_total"] <= 0).sum()
        bad_pop_null = df["pop_total"].isna().sum()
        if bad_pop > 0 or bad_pop_null > 0:
            add("pop_total_positive", "warn", f"{bad_pop} rows with pop_total <= 0, {bad_pop_null} nulls")
        else:
            add("pop_total_positive", "pass", "All pop_total > 0")
    else:
        add("pop_total_positive", "warn", "Column 'pop_total' not found -- check skipped")

    if "pib" in df.columns:
        bad_pib_neg = (df["pib"] < 0).sum()
        bad_pib_null = df["pib"].isna().sum()
        if bad_pib_neg > 0:
            add("pib_positive", "fail", f"{bad_pib_neg} rows with pib < 0 -- CRITICAL")
            critical_failed = True
        elif bad_pib_null > 0:
            add("pib_positive", "warn", f"{bad_pib_null} rows with pib null (source data gap)")
        else:
            add("pib_positive", "pass", "All pib > 0")
    else:
        add("pib_positive", "warn", "Column 'pib' not found -- check skipped")

    # D2
    check_non_negative("profundidade_pib")
    check_non_negative("credito_pib")
    check_non_negative("irpb")

    # D3
    check_non_negative("rcd")
    # sli_pc: sem restricao de sinal (positivo = credor liquido, negativo = tomador)
    check_in_unit("irf")

    # D4
    check_non_negative("pix_tx_pc")
    check_non_negative("pix_val_pib")

    # D5 indices relativos
    check_non_negative("irc")
    check_non_negative("ird")

    # Indices sinteticos: [0,1] por construcao (min-max normalizacao global)
    for col in ("imb", "imdf"):
        if col not in df.columns:
            add(f"{col}_range", "warn", f"Column '{col}' not found -- check skipped")
            continue
        out = t0[col].dropna().between(0, 1).eq(False).sum()
        if out > 0:
            add(f"{col}_range", "warn", f"{out} t0 rows with {col} outside [0, 1]")
        else:
            add(f"{col}_range", "pass", f"All t0 {col} in [0, 1]")

    if "rank_imdf_nacional" in df.columns:
        r = t0["rank_imdf_nacional"].dropna().astype(int).sort_values().values
        expected = np.arange(1, len(r) + 1)
        gaps = (r != expected).sum()
        if gaps > 0:
            add("rank_imdf_gaps", "warn", f"{gaps} gaps or duplicates in rank_imdf_nacional")
        else:
            add("rank_imdf_gaps", "pass", f"rank_imdf_nacional is a clean 1..{len(r)} sequence")
    else:
        add("rank_imdf_gaps", "warn", "Column 'rank_imdf_nacional' not found -- check skipped")

    if "cluster_id" in df.columns:
        from pipeline.config import K_CLUSTERS
        valid_ids = set(range(K_CLUSTERS))
        bad_clusters = (~t0["cluster_id"].dropna().astype(int).isin(valid_ids)).sum()
        null_clusters = t0["cluster_id"].isna().sum()
        if bad_clusters > 0:
            add("cluster_id_range", "warn", f"{bad_clusters} t0 rows with cluster_id outside {{0..{K_CLUSTERS-1}}}")
        elif null_clusters > 0:
            add("cluster_id_range", "warn", f"{null_clusters} t0 rows with null cluster_id")
        else:
            add("cluster_id_range", "pass", f"All cluster_id values in {{0..{K_CLUSTERS-1}}}")
    else:
        add("cluster_id_range", "warn", "Column 'cluster_id' not found -- check skipped")

    # =========================================================================
    # BLOCO B — Consistencias matematicas
    # =========================================================================

    # B1: hab_por_ponto == 10000 / dens_pontos
    if "hab_por_ponto" in df.columns and "dens_pontos" in df.columns:
        mask = df["dens_pontos"].notna() & (df["dens_pontos"] > 0) & df["hab_por_ponto"].notna()
        if mask.sum() > 0:
            expected_hab = 10_000 / df.loc[mask, "dens_pontos"]
            actual_hab = df.loc[mask, "hab_por_ponto"]
            rel_err = (actual_hab - expected_hab).abs() / expected_hab
            violations = (rel_err > 0.001).sum()
            pct = violations / mask.sum()
            if pct > 0.01:
                add("hab_dens_consistency", "fail",
                    f"{violations} rows ({pct:.1%}) where hab_por_ponto != 10000/dens_pontos (>0.1% rel error) -- CRITICAL")
                critical_failed = True
            else:
                add("hab_dens_consistency", "pass",
                    f"hab_por_ponto = 10000/dens_pontos within 0.1% for all rows")
        else:
            add("hab_dens_consistency", "warn", "No rows with both dens_pontos > 0 and hab_por_ponto non-null")
    else:
        add("hab_dens_consistency", "warn", "Required columns missing -- hab/dens consistency check skipped")

    # B2: mean(irc) por ponto ~ 1
    if "irc" in df.columns:
        means = df.groupby("ponto")["irc"].mean()
        bad = means[(means < 0.98) | (means > 1.02)]
        if len(bad) > 0:
            add("irc_mean_unity", "fail",
                f"mean(irc) outside [0.98, 1.02] in ponto(s): {dict(bad)} -- CRITICAL")
            critical_failed = True
        else:
            add("irc_mean_unity", "pass", "mean(irc) in [0.98, 1.02] for all pontos")
    else:
        add("irc_mean_unity", "warn", "Column 'irc' not found -- check skipped")

    # B3: mean(ird) por ponto ~ 1
    if "ird" in df.columns:
        means = df.groupby("ponto")["ird"].mean()
        bad = means[(means < 0.98) | (means > 1.02)]
        if len(bad) > 0:
            add("ird_mean_unity", "fail",
                f"mean(ird) outside [0.98, 1.02] in ponto(s): {dict(bad)} -- CRITICAL")
            critical_failed = True
        else:
            add("ird_mean_unity", "pass", "mean(ird) in [0.98, 1.02] for all pontos")
    else:
        add("ird_mean_unity", "warn", "Column 'ird' not found -- check skipped")

    # B4: deserto_bancario == 1 <-> dens_pontos == 0
    col_deserto = "deserto_bancario_flag" if "deserto_bancario_flag" in df.columns else "deserto_bancario"
    if col_deserto in df.columns and "dens_pontos" in df.columns:
        deserto_one = df[col_deserto] == 1
        dens_zero = df["dens_pontos"] == 0
        mismatch = (deserto_one != dens_zero).sum()
        if mismatch > 0:
            add("deserto_dens_alignment", "fail",
                f"{mismatch} rows where deserto_bancario and dens_pontos=0 are misaligned -- CRITICAL")
            critical_failed = True
        else:
            add("deserto_dens_alignment", "pass", "deserto_bancario <-> dens_pontos=0 perfectly aligned")
    else:
        add("deserto_dens_alignment", "warn", "Required columns missing -- deserto/dens alignment check skipped")

    # B5: rcd NULL exatamente onde depositos_total == 0
    if "rcd" in df.columns and "depositos_total" in df.columns:
        zero_dep = df["depositos_total"] == 0
        rcd_null = df["rcd"].isna()
        mismatch_a = (zero_dep & ~rcd_null).sum()
        mismatch_b = (~zero_dep & rcd_null).sum()
        if mismatch_a > 0:
            add("rcd_null_consistency", "fail", f"{mismatch_a} rows where depositos_total=0 but rcd is not NULL")
        elif mismatch_b > 0:
            add("rcd_null_consistency", "warn", f"{mismatch_b} rows where depositos_total>0 but rcd is NULL")
        else:
            add("rcd_null_consistency", "pass", "rcd NULL exactly where depositos_total=0")
    else:
        add("rcd_null_consistency", "warn", "Columns 'rcd' or 'depositos_total' not found -- check skipped")

    # B6: hab_por_ponto NULL exatamente onde dens_pontos == 0
    if "hab_por_ponto" in df.columns and "dens_pontos" in df.columns:
        dens_zero = df["dens_pontos"] == 0
        hab_null = df["hab_por_ponto"].isna()
        mismatch = (dens_zero != hab_null).sum()
        if mismatch > 0:
            add("hab_por_ponto_null", "fail",
                f"{mismatch} rows where dens_pontos=0 and hab_por_ponto null are misaligned")
        else:
            add("hab_por_ponto_null", "pass", "hab_por_ponto NULL exactly where dens_pontos=0")
    else:
        add("hab_por_ponto_null", "warn", "Required columns missing -- hab_por_ponto null check skipped")

    # =========================================================================
    # BLOCO C — Cobertura por variavel em t0 (warn se < 90%)
    # =========================================================================

    EXPECTED_FILLED = [
        "dens_agencias", "dens_pontos", "deserto_bancario_flag",
        "credito_pc", "deposito_pc", "profundidade_pib", "credito_pib", "irpb",
        "rcd", "sli_pc", "irf",
        "irc", "ird",
        "imb", "imdf", "rank_imdf_nacional", "cluster_id",
    ]

    n_t0 = len(t0)
    for col in EXPECTED_FILLED:
        if col not in t0.columns:
            add(f"cov_{col}", "warn", f"Column '{col}' not found in t0 -- coverage check skipped")
            continue
        filled_pct = t0[col].notna().sum() / n_t0 if n_t0 > 0 else 0.0
        if filled_pct < 0.90:
            add(f"cov_{col}", "warn", f"{col} coverage at t0: {filled_pct:.1%} (< 90%)")
        else:
            add(f"cov_{col}", "pass", f"{col} coverage at t0: {filled_pct:.1%}")

    # PIX: nullable por design, threshold menor
    pix_pct = 0.0
    if "pix_tx_pc" in t0.columns:
        pix_pct = t0["pix_tx_pc"].notna().sum() / n_t0 if n_t0 > 0 else 0.0
        if pix_pct < 0.80:
            add("cov_pix_tx_pc", "warn", f"PIX coverage at t0: {pix_pct:.1%} (< 80% threshold)")
        else:
            add("cov_pix_tx_pc", "pass", f"PIX coverage at t0: {pix_pct:.1%}")

    # =========================================================================
    # BLOCO D — Metadata PCA
    # =========================================================================

    try:
        var_exp = meta_indices["imdf"]["variancia_exp"]
        if var_exp < 0.40:
            add("pca_variance_imdf", "warn", f"IMDF PCA explained variance {var_exp:.2%} < 40%")
        else:
            add("pca_variance_imdf", "pass", f"IMDF PCA explained variance {var_exp:.2%}")
    except (KeyError, TypeError):
        add("pca_variance_imdf", "warn", "meta_indices['imdf']['variancia_exp'] not available")

    # =========================================================================
    # Resultado final
    # =========================================================================

    coverage = {
        "pix_pct_filled": round(pix_pct, 4),
        "t0_municipios": int(t0["municipio_id"].nunique()) if "municipio_id" in df.columns else 0,
    }

    overall_pass = not critical_failed and not any(c["status"] == "fail" for c in checks)

    result = {
        "pass": overall_pass,
        "checks": checks,
        "coverage": coverage,
    }

    if critical_failed:
        print("CRITICAL QA FAILURE -- aborting pipeline")
        for c in checks:
            if c["status"] == "fail":
                print(f"  [FAIL] {c['name']}: {c['detail']}")
        sys.exit(1)

    return result
