"""
IMB and IMDF index calculations via PCA.

Strategy:
- Fit PCA on t0 data only.
- Apply same transform (using t0 mean/std) to t_12 and t_24.
- Sign convention: ensure positive correlation with deposito_pc.
"""

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA

from .utils import log_transform, zscore


_PONTOS_ORDER = ["t0", "t_12", "t_24"]

_IMB_VARS = ["dens_agencias", "dens_pontos", "valor_pix_pc", "deposito_pc"]
_IMDF_VARS = ["credito_pc", "deposito_pc", "dens_agencias", "dens_pontos", "pix_tx_pc", "profundidade_pib"]

# These variables need log_transform before z-scoring (they were NOT already log-transformed in D2)
# Note: credito_pc and deposito_pc were already log+winsorized in D2; others need log first.
_NEEDS_LOG = {"dens_agencias", "dens_pontos", "valor_pix_pc", "pix_tx_pc", "profundidade_pib"}


def _prepare_features(df_t0: pd.DataFrame, df_all: pd.DataFrame, vars: list[str]) -> tuple[np.ndarray, np.ndarray, dict]:
    """
    Fit log+zscore transform on t0, apply to all pontos.
    Returns (X_t0, X_all, transform_params).
    X_all rows align with df_all index.
    """
    params = {}  # var -> (mean, std) computed on t0 log-values

    # Compute log-transformed t0 values to derive mean/std
    t0_transformed = {}
    for var in vars:
        vals = df_t0[var].copy().astype(float)
        if var in _NEEDS_LOG:
            vals = log_transform(vals)
        t0_transformed[var] = vals
        params[var] = (vals.mean(), vals.std())

    # Build X_t0 (rows = municipalities, cols = vars)
    t0_cols = []
    for var in vars:
        mean, std = params[var]
        col = (t0_transformed[var] - mean) / (std if std > 0 else 1.0)
        t0_cols.append(col.values)
    X_t0 = np.column_stack(t0_cols)

    # Build X_all using t0 transform params
    all_cols = []
    for var in vars:
        vals = df_all[var].copy().astype(float)
        if var in _NEEDS_LOG:
            vals = log_transform(vals)
        mean, std = params[var]
        col = (vals - mean) / (std if std > 0 else 1.0)
        all_cols.append(col.values)
    X_all = np.column_stack(all_cols)

    return X_t0, X_all, params


def _fit_pca_index(
    df: pd.DataFrame,
    vars: list[str],
    sign_ref_var: str,
    index_name: str,
) -> tuple[pd.Series, dict]:
    """
    Fit PCA(n_components=1) on t0, project all pontos, enforce sign convention.
    Returns (scores Series aligned with df.index, meta dict).
    """
    df_t0 = df[df["ponto"] == "t0"].copy()

    # Drop rows missing any variable for fitting
    fit_mask_t0 = df_t0[vars].notna().all(axis=1)
    df_t0_fit = df_t0[fit_mask_t0]

    if len(df_t0_fit) < 2:
        scores = pd.Series(np.nan, index=df.index, name=index_name)
        meta = {"variaveis": vars, "cargas": [], "variancia_exp": float("nan")}
        return scores, meta

    X_t0_fit, X_all_fit, _params = _prepare_features(df_t0_fit, df, vars)

    # Fit PCA on t0 (complete rows only)
    pca = PCA(n_components=1)
    pca.fit(X_t0_fit)

    # Project all rows (will produce NaN for rows with any NaN feature via manual dot)
    # We manually compute to propagate NaN properly
    loading = pca.components_[0]  # shape (n_vars,)

    scores_raw = np.full(len(df), np.nan)
    for i in range(len(df)):
        row = X_all_fit[i]
        if not np.any(np.isnan(row)):
            scores_raw[i] = float(row @ loading)

    scores = pd.Series(scores_raw, index=df.index, name=index_name)

    # Sign convention: ensure positive correlation with sign_ref_var (on t0 rows)
    t0_idx = df[df["ponto"] == "t0"].index
    ref_vals = df.loc[t0_idx, sign_ref_var]
    score_t0 = scores.loc[t0_idx]
    valid = ref_vals.notna() & score_t0.notna()
    if valid.sum() >= 2:
        corr = score_t0[valid].corr(ref_vals[valid])
        if corr < 0:
            scores = -scores
            loading = -loading

    meta = {
        "variaveis": vars,
        "cargas": loading.tolist(),
        "variancia_exp": float(pca.explained_variance_ratio_[0]),
    }
    return scores, meta


def compute_indices(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Compute IMB and IMDF via PCA.

    Returns:
        df_with_indices: DataFrame with imb, imdf, rank_imdf_nacional, rank_imdf_uf columns.
        meta: dict with PCA metadata for meta_imdf table.
    """
    df = df.copy()

    # --- IMB ---
    imb_scores, imb_meta = _fit_pca_index(df, _IMB_VARS, sign_ref_var="deposito_pc", index_name="imb")
    df["imb"] = imb_scores

    # --- IMDF ---
    imdf_scores, imdf_meta = _fit_pca_index(df, _IMDF_VARS, sign_ref_var="deposito_pc", index_name="imdf")
    df["imdf"] = imdf_scores

    # --- Ranks (t0 only, highest IMDF = rank 1) ---
    df["rank_imdf_nacional"] = np.nan
    df["rank_imdf_uf"] = np.nan  # Placeholder — UF lookup not available at this stage

    t0_mask = df["ponto"] == "t0"
    t0_imdf = df.loc[t0_mask, "imdf"]
    # rank: ascending=False means highest value gets rank 1
    df.loc[t0_mask, "rank_imdf_nacional"] = t0_imdf.rank(ascending=False, method="min", na_option="keep")

    meta = {
        "imb": imb_meta,
        "imdf": imdf_meta,
    }
    return df, meta
