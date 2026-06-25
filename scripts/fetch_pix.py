"""
Fetches Pix transaction data by municipality from BCB's open data API.
Covers March 2024 to the latest available month (auto-detected).
Stores all 18 API fields + 2 derived aggregates in SQLite.
"""

import sqlite3
import urllib.request
import json
from datetime import date

DB_PATH = "public/data/pix_municipios.db"
BASE_URL = (
    "https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/"
    "TransacoesPixPorMunicipio(DataBase=@DataBase)"
)
START_YEAR, START_MONTH = 2024, 3


def months_from(year: int, month: int) -> list[str]:
    result = []
    y, m = year, month
    today = date.today()
    while (y, m) <= (today.year, today.month):
        result.append(f"{y}{m:02d}")
        m += 1
        if m > 12:
            m, y = 1, y + 1
    return result


def fetch_month(anomes: str) -> list[dict]:
    # Note: DataBase parameter is ignored by the API; $filter is the correct filter.
    url = (
        f"{BASE_URL}?@DataBase=''&"
        f"$filter=AnoMes%20eq%20{anomes}&"
        f"$top=10000&$format=json"
    )
    with urllib.request.urlopen(url, timeout=60) as resp:
        data = json.loads(resp.read())
    return data.get("value", [])


def detect_latest(candidates: list[str]) -> str:
    for anomes in reversed(candidates):
        print(f"  probing {anomes}...", end=" ", flush=True)
        rows = fetch_month(anomes)
        if rows:
            print(f"{len(rows)} rows -- latest available")
            return anomes
        print("empty")
    raise RuntimeError("No data found in any candidate month")


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute("DROP TABLE IF EXISTS pix_municipios")
    conn.execute("""
        CREATE TABLE pix_municipios (
            AnoMes              INTEGER,
            Municipio_Ibge      INTEGER,
            Municipio           TEXT,
            Estado_Ibge         INTEGER,
            Estado              TEXT,
            Sigla_Regiao        TEXT,
            Regiao              TEXT,
            VL_PagadorPF        REAL,
            QT_PagadorPF        INTEGER,
            VL_PagadorPJ        REAL,
            QT_PagadorPJ        INTEGER,
            VL_RecebedorPF      REAL,
            QT_RecebedorPF      INTEGER,
            VL_RecebedorPJ      REAL,
            QT_RecebedorPJ      INTEGER,
            QT_PES_PagadorPF    INTEGER,
            QT_PES_PagadorPJ    INTEGER,
            QT_PES_RecebedorPF  INTEGER,
            QT_PES_RecebedorPJ  INTEGER,
            QT_Total_Pagador    INTEGER,
            QT_Total_Recebedor  INTEGER,
            PRIMARY KEY (AnoMes, Municipio_Ibge)
        )
    """)
    conn.commit()


def insert_rows(conn: sqlite3.Connection, rows: list[dict]) -> int:
    records = []
    for r in rows:
        qt_pag = (r.get("QT_PagadorPF") or 0) + (r.get("QT_PagadorPJ") or 0)
        qt_rec = (r.get("QT_RecebedorPF") or 0) + (r.get("QT_RecebedorPJ") or 0)
        records.append((
            r.get("AnoMes"),
            r.get("Municipio_Ibge"),
            r.get("Municipio"),
            r.get("Estado_Ibge"),
            r.get("Estado"),
            r.get("Sigla_Regiao"),
            r.get("Regiao"),
            r.get("VL_PagadorPF"),
            r.get("QT_PagadorPF"),
            r.get("VL_PagadorPJ"),
            r.get("QT_PagadorPJ"),
            r.get("VL_RecebedorPF"),
            r.get("QT_RecebedorPF"),
            r.get("VL_RecebedorPJ"),
            r.get("QT_RecebedorPJ"),
            r.get("QT_PES_PagadorPF"),
            r.get("QT_PES_PagadorPJ"),
            r.get("QT_PES_RecebedorPF"),
            r.get("QT_PES_RecebedorPJ"),
            qt_pag,
            qt_rec,
        ))
    conn.executemany(
        "INSERT INTO pix_municipios VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        records,
    )
    conn.commit()
    return len(records)


def main() -> None:
    all_months = months_from(START_YEAR, START_MONTH)

    print("Detecting latest available month...")
    latest = detect_latest(all_months[-4:])
    latest_idx = all_months.index(latest)
    months_to_fetch = all_months[:latest_idx + 1]

    print(f"\nFetching {len(months_to_fetch)} months: {months_to_fetch[0]} to {months_to_fetch[-1]}")

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    total = 0
    for anomes in months_to_fetch:
        print(f"  {anomes}...", end=" ", flush=True)
        rows = fetch_month(anomes)
        n = insert_rows(conn, rows)
        total += n
        print(f"{n} rows")

    conn.close()
    print(f"\nDone. {total} rows written to {DB_PATH}")


if __name__ == "__main__":
    main()
