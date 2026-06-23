import pandas as pd


def _pad_mun(code) -> str:
    return str(int(code)).zfill(7)


def load_ifdm(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-ifdm.xlsx"
    # Sheet: 'IFDM Geral', 3-row header (rows 0-2), actual data starts row 3
    # Row 1 has: Ranking IFDM | nan | Região | UF | Município | IFDM | Educação | Saúde | Emprego & Renda
    # Row 2 has: Nacional | Estadual | ...
    # Use rows 1+2 together but simplest: read with skiprows=1, then fix header
    df = pd.read_excel(
        path,
        sheet_name="IFDM Geral",
        header=None,
        skiprows=3,  # skip the 3 header rows
        engine="openpyxl",
    )
    # Columns positionally: 0=rank_nacional, 1=rank_estadual, 2=regiao, 3=uf, 4=municipio, 5=ifdm, 6=educacao, 7=saude, 8=emprego_renda
    df.columns = ["rank_nacional", "rank_estadual", "regiao", "uf", "municipio", "ifdm", "educacao", "saude", "ifdm_emprego_renda"]

    df = df.dropna(subset=["ifdm"])

    # IFDM has no IBGE code — must match by UF + municipality name
    # Load population file to get the mapping
    pop_path = data_dir / "municipios-populacao.xls"
    pop = pd.read_excel(pop_path, engine="xlrd", header=0)
    pop.columns = [str(c).strip() for c in pop.columns]
    code_col = next(c for c in pop.columns if "MUNIC" in c.upper() and "COD" in c.upper() and "UF" not in c.upper())
    uf_col = next(c for c in pop.columns if c.upper() == "UF")
    name_col = next(c for c in pop.columns if "NOME" in c.upper())

    pop["municipio_id"] = pop[code_col].apply(_pad_mun)
    pop["uf"] = pop[uf_col].str.strip()
    pop["municipio_norm"] = pop[name_col].str.upper().str.strip()

    df["municipio_norm"] = df["municipio"].str.upper().str.strip()
    df["uf"] = df["uf"].str.strip()

    merged = df.merge(
        pop[["municipio_id", "uf", "municipio_norm"]],
        on=["uf", "municipio_norm"],
        how="left",
    )

    result = merged[["municipio_id", "ifdm", "ifdm_emprego_renda"]].dropna(subset=["municipio_id"])
    return result.drop_duplicates("municipio_id").reset_index(drop=True)
