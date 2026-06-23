import pandas as pd


def _pad_mun(code) -> str:
    return str(int(code)).zfill(7)


def _to_yyyymm(val) -> str:
    return str(int(val))


def _load_canais(path) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name=0, header=0, engine="openpyxl")
    # Date column is 'DATA', municipality key is 'MUNICIPIO IBGE'
    # Strip whitespace from column names
    df.columns = [str(c).strip() for c in df.columns]
    mun_col = next(c for c in df.columns if "MUNICIPIO IBGE" in c.upper())
    df["municipio_id"] = pd.to_numeric(df[mun_col], errors="coerce").dropna()
    df = df.dropna(subset=[mun_col])
    df["municipio_id"] = df[mun_col].apply(lambda x: _pad_mun(x) if pd.notna(x) and str(x).strip() not in ("", "0") else None)
    df = df.dropna(subset=["municipio_id"])
    df["data_base"] = df["DATA"].apply(_to_yyyymm)
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
    # PAE rows with no valid municipio_id (international branches) already dropped
    return (
        df.groupby(["municipio_id", "data_base"], as_index=False)
        .size()
        .rename(columns={"size": "num_paes"})
    )
