import pandas as pd


def _pad_mun(code) -> str | None:
    try:
        v = int(float(str(code).strip()))
        return str(v).zfill(7) if v > 0 else None
    except (ValueError, TypeError):
        return None


def _to_yyyymm(val) -> str:
    return str(int(val))


def _load_canais(path) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name=0, header=0, engine="openpyxl")
    df.columns = [str(c).strip() for c in df.columns]
    mun_col = next(c for c in df.columns if c.upper() == "MUNICIPIO IBGE")
    date_col = "DATA"

    df["municipio_id"] = df[mun_col].apply(_pad_mun)
    df = df.dropna(subset=["municipio_id"])
    df["data_base"] = df[date_col].apply(_to_yyyymm)
    return df[["municipio_id", "data_base"]]


def load_postos(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-postos.xlsx"
    df = _load_canais(path)
    return (
        df.groupby(["municipio_id", "data_base"], as_index=False)
        .size()
        .rename(columns={"size": "num_postos"})
    )


def load_paes(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-pae.xlsx"
    df = _load_canais(path)
    return (
        df.groupby(["municipio_id", "data_base"], as_index=False)
        .size()
        .rename(columns={"size": "num_paes"})
    )
