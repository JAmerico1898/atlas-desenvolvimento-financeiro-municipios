"""
QA validation for ADFM pipeline output DataFrame.
"""

import sys
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

    # --- Check 1: Cobertura (CRITICAL) ---
    t0_muns = df[df["ponto"] == "t0"]["municipio_id"].nunique()
    if abs(t0_muns - 5570) <= 50:
        add("cobertura_municipios", "pass", f"{t0_muns} municipalities at t0 (expected 5570 ± 50)")
    else:
        add("cobertura_municipios", "fail", f"{t0_muns} municipalities at t0, expected 5570 ± 50 — CRITICAL")
        critical_failed = True

    # --- Check 2: municipio_id format (CRITICAL) ---
    null_ids = df["municipio_id"].isna().sum()
    if null_ids > 0:
        add("municipio_id_nulls", "fail", f"{null_ids} null municipio_id values — CRITICAL")
        critical_failed = True
    else:
        add("municipio_id_nulls", "pass", "No null municipio_id values")

    bad_format = df["municipio_id"].dropna().astype(str).str.match(r"^\d{7}$").eq(False).sum()
    if bad_format > 0:
        add("municipio_id_format", "fail", f"{bad_format} municipio_id values not matching 7-digit pattern — CRITICAL")
        critical_failed = True
    else:
        add("municipio_id_format", "pass", "All municipio_id values are 7-digit strings")

    dups = df.groupby("ponto")["municipio_id"].apply(lambda s: s.duplicated().sum()).sum()
    if dups > 0:
        add("municipio_id_duplicates", "fail", f"{dups} duplicate municipio_id per ponto — CRITICAL")
        critical_failed = True
    else:
        add("municipio_id_duplicates", "pass", "No duplicate municipio_id within any ponto")

    # --- Check 3: UF check (skipped — UF is in dim_municipio, not in df) ---
    add("uf_check", "warn", "SKIPPED — UF lives in dim_municipio (shapefile); not available in indicators DataFrame")

    # --- Check 4: irf ∈ [0,1] ---
    if "irf" in df.columns:
        out_of_range = df["irf"].dropna().between(0, 1).eq(False).sum()
        if out_of_range > 0:
            add("irf_range", "warn", f"{out_of_range} rows have irf outside [0,1]")
        else:
            add("irf_range", "pass", "All irf values in [0,1]")
    else:
        add("irf_range", "warn", "Column 'irf' not found in DataFrame")

    # --- Check 5: pop_total > 0 ---
    if "pop_total" in df.columns:
        bad_pop = (df["pop_total"] <= 0).sum()
        if bad_pop > 0:
            add("pop_total_positive", "fail", f"{bad_pop} rows with pop_total <= 0")
            critical_failed = True
        else:
            add("pop_total_positive", "pass", "All pop_total > 0")
    else:
        add("pop_total_positive", "warn", "Column 'pop_total' not found in DataFrame")

    # --- Check 6: pib > 0 ---
    if "pib" in df.columns:
        bad_pib = (df["pib"] <= 0).sum()
        if bad_pib > 0:
            add("pib_positive", "fail", f"{bad_pib} rows with pib <= 0")
            critical_failed = True
        else:
            add("pib_positive", "pass", "All pib > 0")
    else:
        add("pib_positive", "warn", "Column 'pib' not found in DataFrame")

    # --- Check 7: rcd NULL exactly where depositos_total == 0 ---
    if "rcd" in df.columns and "depositos_total" in df.columns:
        zero_dep = df["depositos_total"] == 0
        rcd_null = df["rcd"].isna()
        # rcd should be null where depositos_total == 0
        mismatch_a = (zero_dep & ~rcd_null).sum()   # depositos==0 but rcd not null
        mismatch_b = (~zero_dep & rcd_null).sum()   # depositos>0 but rcd null (lenient: may be nulled by safe_ratio for other reasons)
        if mismatch_a > 0:
            add("rcd_null_consistency", "fail", f"{mismatch_a} rows where depositos_total==0 but rcd is not NULL")
        elif mismatch_b > 0:
            add("rcd_null_consistency", "warn", f"{mismatch_b} rows where depositos_total>0 but rcd is NULL (possible safe_ratio edge case)")
        else:
            add("rcd_null_consistency", "pass", "rcd NULL exactly where depositos_total==0")
    else:
        add("rcd_null_consistency", "warn", "Columns 'rcd' or 'depositos_total' not found — check skipped")

    # --- Check 8: hab_por_ponto NULL exactly where (num_agencias + num_postos) == 0 ---
    if "hab_por_ponto" in df.columns and "num_agencias" in df.columns and "num_postos" in df.columns:
        zero_pts = (df["num_agencias"] + df["num_postos"]) == 0
        hab_null = df["hab_por_ponto"].isna()
        mismatch = (zero_pts & ~hab_null).sum()
        if mismatch > 0:
            add("hab_por_ponto_null", "fail", f"{mismatch} rows where (agencias+postos)==0 but hab_por_ponto is not NULL")
        else:
            add("hab_por_ponto_null", "pass", "hab_por_ponto NULL correctly where (agencias+postos)==0")
    else:
        add("hab_por_ponto_null", "warn", "Required columns missing — hab_por_ponto check skipped")

    # --- Check 9: deserto_bancario consistency ---
    # deserto_bancario_flag == 1 wherever hab_por_ponto IS NULL
    col_deserto = "deserto_bancario_flag" if "deserto_bancario_flag" in df.columns else "deserto_bancario"
    if col_deserto in df.columns and "hab_por_ponto" in df.columns:
        hab_null = df["hab_por_ponto"].isna()
        deserto_one = df[col_deserto] == 1
        inconsistent = (hab_null & ~deserto_one).sum() + (~hab_null & deserto_one).sum()
        if inconsistent > 0:
            add("deserto_bancario_consistency", "warn", f"{inconsistent} rows where deserto_bancario and hab_por_ponto are inconsistent")
        else:
            add("deserto_bancario_consistency", "pass", "deserto_bancario consistent with hab_por_ponto NULL")
    else:
        add("deserto_bancario_consistency", "warn", "Required columns missing — deserto_bancario consistency check skipped")

    # --- Check 10: PIX coverage ---
    pix_pct = 0.0
    if "pix_tx_pc" in df.columns:
        t0_df = df[df["ponto"] == "t0"]
        pix_filled = t0_df["pix_tx_pc"].notna().sum()
        pix_total = len(t0_df)
        pix_pct = pix_filled / pix_total if pix_total > 0 else 0.0
        if pix_pct < 0.80:
            add("pix_coverage", "warn", f"PIX coverage at t0: {pix_pct:.1%} (< 80% threshold)")
        else:
            add("pix_coverage", "pass", f"PIX coverage at t0: {pix_pct:.1%}")
    else:
        add("pix_coverage", "warn", "Column 'pix_tx_pc' not found — PIX coverage check skipped")

    # --- Check 11: PCA variance ---
    try:
        var_exp = meta_indices["imdf"]["variancia_exp"]
        if var_exp < 0.40:
            add("pca_variance_imdf", "warn", f"IMDF PCA explained variance {var_exp:.2%} < 40%")
        else:
            add("pca_variance_imdf", "pass", f"IMDF PCA explained variance {var_exp:.2%}")
    except (KeyError, TypeError):
        add("pca_variance_imdf", "warn", "meta_indices['imdf']['variancia_exp'] not available")

    # --- Check 12: irpb, irc, ird > 0 ---
    for col in ["irpb", "irc", "ird"]:
        if col in df.columns:
            negatives = (df[col] < 0).sum()
            if negatives > 0:
                add(f"{col}_non_negative", "warn", f"{negatives} rows with {col} < 0")
            else:
                add(f"{col}_non_negative", "pass", f"No negative values in {col}")
        else:
            add(f"{col}_non_negative", "warn", f"Column '{col}' not found — check skipped")

    # Build coverage summary
    coverage = {"pix_pct_filled": round(pix_pct, 4)}
    if "municipio_id" in df.columns:
        coverage["t0_municipios"] = int(df[df["ponto"] == "t0"]["municipio_id"].nunique())

    overall_pass = not critical_failed and not any(c["status"] == "fail" for c in checks)

    result = {
        "pass": overall_pass,
        "checks": checks,
        "coverage": coverage,
    }

    if critical_failed:
        print("CRITICAL QA FAILURE — aborting pipeline")
        sys.exit(1)

    return result
