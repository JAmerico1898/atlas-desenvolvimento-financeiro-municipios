"""Shared utility functions for indicator calculations."""

import numpy as np
import pandas as pd


def winsorize(series: pd.Series, p=(0.01, 0.99)) -> pd.Series:
    """Clip values to [p_low, p_high] percentiles, ignoring NaN."""
    low = series.quantile(p[0])
    high = series.quantile(p[1])
    return series.clip(lower=low, upper=high)


def zscore(series: pd.Series) -> pd.Series:
    """Standard z-score (mean=0, std=1), ignoring NaN."""
    mean = series.mean()
    std = series.std()
    if std == 0 or pd.isna(std):
        return pd.Series(np.nan, index=series.index)
    return (series - mean) / std


def safe_ratio(num: pd.Series, den: pd.Series) -> pd.Series:
    """Return num/den; NaN where den <= 0."""
    result = num / den.where(den > 0)
    return result


def log_transform(series: pd.Series) -> pd.Series:
    """log(x + 1) for non-negative values, NaN for negatives."""
    result = series.copy().astype(float)
    result[series < 0] = np.nan
    result[series >= 0] = np.log1p(series[series >= 0])
    return result
