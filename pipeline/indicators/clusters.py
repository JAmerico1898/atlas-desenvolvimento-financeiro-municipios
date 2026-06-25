"""
K-Means clustering on t0 data with optional Hungarian relabeling.

Features: standardized D1+D2+D3+D4 indicators + imdf.
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

try:
    from scipy.optimize import linear_sum_assignment
    _HAS_SCIPY = True
except ImportError:
    _HAS_SCIPY = False


# 7 features used for clustering (matches user-facing description)
_CLUSTER_FEATURES = [
    "dens_pontos",   # D1 access
    "credito_pc",    # D2 depth
    "deposito_pc",   # D2 depth
    "rcd",           # D3 intermediation (filled 0 for banking deserts)
    "pix_tx_pc",     # D4 digitalization
    "imb",           # composite bankarization index
    "imdf",          # composite development index
]

_LABELS_BY_RANK = [
    "Alta Inclusão",
    "Média-Alta Inclusão",
    "Média Inclusão",
    "Média-Baixa Inclusão",
    "Baixa Inclusão",
]


def _auto_label(cluster_centroids_imdf: pd.Series, k: int) -> dict:
    """
    Map cluster ids to labels based on IMDF centroid rank.
    Returns {cluster_id: label}.
    """
    sorted_ids = cluster_centroids_imdf.sort_values(ascending=False).index.tolist()
    n_labels = len(_LABELS_BY_RANK)
    label_map = {}
    for rank, cid in enumerate(sorted_ids):
        label_idx = min(rank, n_labels - 1)
        label_map[int(cid)] = _LABELS_BY_RANK[label_idx]
    return label_map


def _hungarian_relabel(new_centroids: np.ndarray, prior_centroids: np.ndarray) -> dict:
    """
    Align new cluster ids to prior cluster ids using the Hungarian algorithm.
    Returns {new_id: prior_id} mapping.
    Minimizes total centroid distance.
    """
    k_new = new_centroids.shape[0]
    k_prior = prior_centroids.shape[0]
    k = min(k_new, k_prior)

    # Cost matrix: distance between each pair
    cost = np.zeros((k, k))
    for i in range(k):
        for j in range(k):
            cost[i, j] = np.linalg.norm(new_centroids[i] - prior_centroids[j])

    row_ind, col_ind = linear_sum_assignment(cost)
    return {int(r): int(c) for r, c in zip(row_ind, col_ind)}


def compute_clusters(
    df: pd.DataFrame,
    k: int = 5,
    prior_profiles: list[dict] | None = None,
) -> tuple[pd.DataFrame, list[dict]]:
    """
    Cluster municipalities on t0 data.

    Args:
        df: Panel DataFrame with D1–D4 indicators and imdf already computed.
        k: Number of clusters.
        prior_profiles: Optional list of prior cluster profile dicts from DB
                        (each must have 'cluster_id' and 'centroid' keys).

    Returns:
        df with 'cluster_id' column added.
        list of cluster profile dicts.
    """
    df = df.copy()

    # Work on t0 only
    t0 = df[df["ponto"] == "t0"].copy()

    # Select features available in this dataset
    available_features = [f for f in _CLUSTER_FEATURES if f in t0.columns]

    # Rows with complete features for clustering
    feat_df = t0[available_features].copy()
    # Banking deserts have rcd=NaN (0 credit / 0 deposits); fill with 0 so they can be clustered
    feat_df["rcd"] = feat_df["rcd"].fillna(0)
    complete_mask = feat_df.notna().all(axis=1)
    t0_complete = t0[complete_mask].copy()

    if len(t0_complete) < k:
        # Not enough data to cluster — assign all to cluster 0
        df["cluster_id"] = 0
        profiles = [{"cluster_id": 0, "rotulo": "Sem dados suficientes", "n_municipios": len(t0), "perfil": {}}]
        return df, profiles

    X = feat_df.loc[complete_mask].values

    # Standardize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # KMeans
    km = KMeans(n_clusters=k, n_init=10, random_state=42)
    km.fit(X_scaled)
    raw_labels = km.labels_  # shape (n_complete,)
    centroids_scaled = km.cluster_centers_  # shape (k, n_features)

    # Optional: Hungarian relabeling against prior centroids
    final_labels = raw_labels.copy()
    if prior_profiles is not None and len(prior_profiles) >= k and _HAS_SCIPY:
        prior_centroids = np.array([p["centroid"] for p in prior_profiles[:k]])
        remap = _hungarian_relabel(centroids_scaled, prior_centroids)
        final_labels = np.array([remap.get(int(lbl), int(lbl)) for lbl in raw_labels])

    # Assign cluster_id to complete t0 rows
    t0_complete = t0_complete.copy()
    t0_complete["cluster_id"] = final_labels

    # For incomplete t0 rows, assign NaN
    t0_incomplete = t0[~complete_mask].copy()
    t0_incomplete["cluster_id"] = np.nan

    # Merge back into full t0
    t0_with_cluster = pd.concat([t0_complete, t0_incomplete]).sort_index()

    # Build municipio_id -> cluster_id mapping from t0
    id_to_cluster = t0_with_cluster.set_index("municipio_id")["cluster_id"].to_dict()

    # Propagate to all pontos
    df["cluster_id"] = df["municipio_id"].map(id_to_cluster)

    # Build centroid series for IMDF (used for auto-labeling)
    cluster_imdf = t0_complete.groupby("cluster_id")["imdf"].mean()

    # Auto-label
    label_map = _auto_label(cluster_imdf, k)

    # National mean and std for z-score computation
    national_mean = {feat: float(t0_complete[feat].mean()) for feat in available_features if feat in t0_complete.columns}
    national_std = {feat: float(t0_complete[feat].std()) for feat in available_features if feat in t0_complete.columns}

    # Build profiles (z-scores relative to national distribution)
    profiles = []
    for cid in sorted(label_map.keys()):
        cluster_rows = t0_complete[t0_complete["cluster_id"] == cid]
        n = len(cluster_rows)
        perfil = {}
        for feat in available_features:
            if feat in cluster_rows.columns:
                cluster_mean = float(cluster_rows[feat].mean())
                nat_mean = national_mean.get(feat, 0.0)
                nat_std = national_std.get(feat, 1.0)
                if nat_std > 0:
                    perfil[feat] = round((cluster_mean - nat_mean) / nat_std, 4)
                else:
                    perfil[feat] = 0.0
        profiles.append({
            "cluster_id": int(cid),
            "rotulo": label_map[cid],
            "n_municipios": int(n),
            "perfil": perfil,
        })

    return df, profiles
