import pandas as pd


def load_ifdm(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-ifdm.xlsx"
    # Sheet: 'IFDM Geral', 3 header rows (rows 0-2), data starts row 3
    # Columns: rank_nacional, rank_estadual, regiao, uf, municipio, ifdm, educacao, saude, emprego_renda
    df = pd.read_excel(
        path,
        sheet_name="IFDM Geral",
        header=None,
        skiprows=3,
        engine="openpyxl",
    )
    df.columns = ["rank_nacional", "rank_estadual", "regiao", "uf", "municipio", "ifdm", "educacao", "saude", "ifdm_emprego_renda"]
    df = df.dropna(subset=["ifdm"])
    df["ifdm"] = pd.to_numeric(df["ifdm"], errors="coerce")
    df["ifdm_emprego_renda"] = pd.to_numeric(df["ifdm_emprego_renda"], errors="coerce")

    # IFDM has no IBGE code — match by UF + municipality name via population file
    pop_path = data_dir / "municipios-populacao.xls"
    pop = pd.read_excel(pop_path, engine="xlrd", header=0)
    pop.columns = [str(c).strip() for c in pop.columns]
    uf_code_col = next(c for c in pop.columns if "COD" in c.upper() and "UF" in c.upper())
    munic_code_col = next(c for c in pop.columns if "COD" in c.upper() and "MUNIC" in c.upper())
    uf_col = next(c for c in pop.columns if c.upper() == "UF")
    name_col = next(c for c in pop.columns if "NOME" in c.upper())

    pop["municipio_id"] = (
        pop[uf_code_col].astype(int).astype(str).str.zfill(2)
        + pop[munic_code_col].astype(int).astype(str).str.zfill(5)
    )
    pop["uf"] = pop[uf_col].str.strip()
    pop["municipio_norm"] = pop[name_col].str.upper().str.strip()

    df["municipio_norm"] = df["municipio"].astype(str).str.upper().str.strip()
    df["uf"] = df["uf"].astype(str).str.strip()

    merged = df.merge(
        pop[["municipio_id", "uf", "municipio_norm"]].drop_duplicates(),
        on=["uf", "municipio_norm"],
        how="left",
    )

    result = merged[["municipio_id", "ifdm", "ifdm_emprego_renda"]].dropna(subset=["municipio_id"])
    return result.drop_duplicates("municipio_id").reset_index(drop=True)
