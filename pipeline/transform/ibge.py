import pandas as pd


def _pad_mun(code) -> str:
    return str(int(float(code))).zfill(7)


def load_populacao(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-populacao.xls"
    df = pd.read_excel(path, engine="xlrd", header=0)
    df.columns = [str(c).strip() for c in df.columns]

    # COD. UF (2 digits) + COD. MUNIC (5 digits) -> 7-digit IBGE code
    uf_col = next(c for c in df.columns if "COD" in c.upper() and "UF" in c.upper())
    munic_col = next(c for c in df.columns if "COD" in c.upper() and "MUNIC" in c.upper())
    pop_col = next(c for c in df.columns if "POPULA" in c.upper())

    df["municipio_id"] = (
        df[uf_col].astype(int).astype(str).str.zfill(2)
        + df[munic_col].astype(int).astype(str).str.zfill(5)
    )
    df["pop_total"] = pd.to_numeric(df[pop_col], errors="coerce").fillna(0).astype(int)

    return df[["municipio_id", "pop_total"]].drop_duplicates("municipio_id")


def load_pib(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-pib.xlsx"
    df = pd.read_excel(path, sheet_name=0, header=0, engine="openpyxl")

    code_col = next(c for c in df.columns if "digo do Munic" in str(c) or "Código do Munic" in str(c))
    pib_col = next(
        c for c in df.columns
        if "Produto Interno Bruto" in str(c) and "per capita" not in str(c)
    )

    df = df.dropna(subset=[code_col])
    df["municipio_id"] = df[code_col].apply(_pad_mun)
    df["pib"] = pd.to_numeric(df[pib_col], errors="coerce") * 1000

    return df[["municipio_id", "pib"]].drop_duplicates("municipio_id")
