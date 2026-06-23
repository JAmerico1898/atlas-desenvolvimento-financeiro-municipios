import pandas as pd


# The dep_vista column is a long combined name with + signs
_DEP_VISTA_COL = (
    "VERBETE_401_SERVICOS_PUBLICOS + VERBETE_402_ATIVIDADES_EMPRESARIAIS + "
    "VERBETE_403_ESPECIAIS_DO_TESOURO_NACIONAL + VERBETE_404_SALDOS_CREDORES_EM_CONTAS_DE_EMPRESTIMOS_E_FINAN + "
    "VERBETE_411_DE_PESSOAS_FISICAS + VERBETE_412_DE_PESSOAS_JURIDICAS + "
    "VERBETE_413_DE_INSTITUICOES_FINANCEIRAS + VERBETE_414_JUDICIAIS + "
    "VERBETE_415_OBRIGATORIOS + VERBETE_416_PARA_INVESTIMENTOS + "
    "VERBETE_417_VINCULADOS + VERBETE_418_DEMAIS_DEPOSITOS + "
    "VERBETE_419_SLD_CRED_CTAS_EMPR_FINANC_OUTR"
)


def _pad_mun(code) -> str | None:
    try:
        return str(int(float(code))).zfill(7)
    except (ValueError, TypeError):
        return None


def _to_yyyymm(val) -> str:
    return str(int(val))


def load_saldos(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-saldos.csv"
    # File has 2 metadata rows, then column headers on row 3 (skiprows=2)
    df = pd.read_csv(path, sep=";", skiprows=2, encoding="latin-1")

    cols = {
        "CODMUN_IBGE": "municipio_id",
        "#DATA_BASE": "data_base",
        "VERBETE_160_OPERACOES_DE_CREDITO": "saldo_credito",
        _DEP_VISTA_COL: "dep_vista",
        "VERBETE_420_DEPOSITOS_DE_POUPANCA": "dep_poupanca",
        "VERBETE_432_DEPOSITOS_A_PRAZO": "dep_prazo",
    }
    df = df.rename(columns=cols)[list(cols.values())]
    df["municipio_id"] = df["municipio_id"].apply(_pad_mun)
    df = df.dropna(subset=["municipio_id"])
    df["data_base"] = df["data_base"].apply(_to_yyyymm)

    numeric_cols = ["saldo_credito", "dep_vista", "dep_poupanca", "dep_prazo"]
    for c in numeric_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    return (
        df.groupby(["municipio_id", "data_base"], as_index=False)[numeric_cols]
        .sum()
    )


def load_agencias(data_dir) -> pd.DataFrame:
    path = data_dir / "municipios-agencia.csv"
    # agencia file has headers on row 1 (no skiprows needed)
    df = pd.read_csv(path, sep=";", encoding="latin-1")

    df["municipio_id"] = df["CODMUN_IBGE"].apply(_pad_mun)
    df["data_base"] = df["#DATA_BASE"].apply(_to_yyyymm)

    return (
        df.groupby(["municipio_id", "data_base"], as_index=False)
        .size()
        .rename(columns={"size": "num_agencias"})
    )
