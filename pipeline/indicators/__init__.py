"""
pipeline/indicators — Indicator calculation layer for ADFM.

Entry point: compute_all(panel_df) → (df_final, meta_indices, cluster_profiles)
"""

import pandas as pd

from .dimensions import compute_dimensions
from .indices import compute_indices
from .clusters import compute_clusters


def compute_all(
    panel_df: pd.DataFrame,
    k_clusters: int = 5,
    prior_profiles: list[dict] | None = None,
) -> tuple[pd.DataFrame, dict, list[dict]]:
    """
    Full indicator pipeline.

    Steps:
        1. D1–D5 via compute_dimensions()
        2. IMB + IMDF via compute_indices()
        3. Clusters via compute_clusters()

    Args:
        panel_df: Base panel from pipeline/transform/panel.py
        k_clusters: Number of KMeans clusters.
        prior_profiles: Optional prior cluster profiles for Hungarian relabeling.

    Returns:
        df_final: DataFrame with all indicator columns.
        meta_indices: PCA metadata for meta_imdf table.
        cluster_profiles: List of cluster profile dicts.
    """
    df = compute_dimensions(panel_df)
    df, meta_indices = compute_indices(df)
    df, cluster_profiles = compute_clusters(df, k=k_clusters, prior_profiles=prior_profiles)

    return df, meta_indices, cluster_profiles


__all__ = ["compute_all", "compute_dimensions", "compute_indices", "compute_clusters"]
