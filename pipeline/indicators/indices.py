"""
IMDF index calculation via two-phase PCA.
IMB via single-phase PCA.

Strategy:
- All input variables min-max normalized to [0,1] before PCA; NaN filled with 0.
- IMDF Phase 1: PCA(n=1) per dimension → 5 scores, each min-max normalized to [0,1].
- IMDF Phase 2: PCA(n=1) on the 5 dimension scores → IMDF, min-max normalized to [0,1].
- IMB: PCA(n=1) on access/PIX/deposit variables, min-max normalized to [0,1].
- No log transforms. No sign flips. Higher score = better for all variables.
"""

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA


_IMB_VARS = ["dens_agencias", "dens_pontos", "valor_pix_pc", "deposito_pc", "credito_pc"]

# IMDF input variables grouped by dimension
_IMDF_DIMS = {
    "d1": ["dens_agencias", "dens_pontos"],
    "d2": ["credito_pc", "deposito_pc", "credito_pib", "profundidade_pib"],
    "d3": ["rcd", "irf"],
    "d4": ["pix_tx_pc"],
    "d5": ["ifdm", "ifdm_emprego_renda"],
}


def _minmax(series: pd.Series) -> pd.Series:
    """Min-max normalize to [0, 1]. Returns zeros if range is zero."""
    s_min = series.min()
    s_max = series.max()
    if s_max > s_min:
        return (series - s_min) / (s_max - s_min)
    return pd.Series(0.0, index=series.index)


def _pca_first_component(df: pd.DataFrame, vars: list) -> tuple:
    """
    Apply PCA(n_components=1) to the given variables.
    Each variable is min-max normalized and NaN-filled with 0 before fitting.
    When vars has a single element, returns its min-max scaling directly (no PCA).
    Returns (scores Series, vars list, loadings array, explained_variance float).
    """
    if len(vars) == 1:
        var = vars[0]
        col = _minmax(df[var].astype(float)).fillna(0.0) if var in df.columns else pd.Series(0.0, index=df.index)
        return col, vars, np.array([1.0]), 1.0

    X_cols = []
    for var in vars:
        if var in df.columns:
            col = _minmax(df[var].astype(float)).fillna(0.0)
        else:
            col = pd.Series(0.0, index=df.index)
        X_cols.append(col.values)

    X = np.column_stack(X_cols)
    pca = PCA(n_components=1)
    scores = pca.fit_transform(X).ravel()
    return (
        pd.Series(scores, index=df.index),
        vars,
        pca.components_[0],
        float(pca.explained_variance_ratio_[0]),
    )


def compute_indices(df: pd.DataFrame) -> tuple:
    """
    Compute IMB and IMDF.

    Returns:
        df: DataFrame with imb, imdf, rank_imdf_nacional, rank_imdf_uf added.
        meta: PCA metadata dict for meta_imdf table.
    """
    df = df.copy()
    meta = {}

    # --- IMB (single PCA) ---
    imb_scores, imb_vars, imb_loadings, imb_var_exp = _pca_first_component(df, _IMB_VARS)
    df["imb"] = _minmax(imb_scores)
    meta["imb"] = {
        "variaveis": imb_vars,
        "cargas": imb_loadings.tolist(),
        "variancia_exp": imb_var_exp,
    }

    # --- IMDF Phase 1: one PCA per dimension ---
    dim_scores = pd.DataFrame(index=df.index)
    phase1_meta = {}
    for dim_name, vars in _IMDF_DIMS.items():
        scores, avail_vars, loadings, var_exp = _pca_first_component(df, vars)
        dim_scores[dim_name] = _minmax(scores)
        phase1_meta[dim_name] = {
            "variaveis": avail_vars,
            "cargas": loadings.tolist(),
            "variancia_exp": var_exp,
        }

    # --- IMDF Phase 2: PCA on the 5 dimension scores ---
    X2 = dim_scores.fillna(0.0).values
    pca2 = PCA(n_components=1)
    imdf_raw = pca2.fit_transform(X2).ravel()
    df["imdf"] = _minmax(pd.Series(imdf_raw, index=df.index))

    meta["imdf"] = {
        "variaveis": list(_IMDF_DIMS.keys()),
        "cargas": pca2.components_[0].tolist(),
        "variancia_exp": float(pca2.explained_variance_ratio_[0]),
        "phase1": phase1_meta,
    }

    # --- Ranks (rank 1 = highest IMDF) ---
    df["rank_imdf_nacional"] = df["imdf"].rank(ascending=False, method="min", na_option="keep")
    df["rank_imdf_uf"] = np.nan  # Placeholder — resolved after UF join

    return df, meta
