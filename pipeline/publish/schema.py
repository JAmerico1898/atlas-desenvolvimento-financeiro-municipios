"""
Database schema creation for ADFM Neon (Postgres) database.
"""

import psycopg


def create_tables(conn: psycopg.Connection) -> None:
    """Create all ADFM tables and indexes if they don't exist."""
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS unaccent")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS dim_municipio (
              municipio_id        TEXT PRIMARY KEY,
              nome                TEXT NOT NULL,
              uf                  TEXT NOT NULL,
              regiao              TEXT NOT NULL,
              lat                 DOUBLE PRECISION,
              lon                 DOUBLE PRECISION,
              pop_total           INTEGER,
              pib                 NUMERIC,
              ano_ref_pib         SMALLINT,
              ifdm                NUMERIC,
              ifdm_emprego_renda  NUMERIC
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS fato_indicadores_municipio (
              municipio_id        TEXT PRIMARY KEY REFERENCES dim_municipio(municipio_id),
              data_ref_estban     TEXT,
              data_ref_pix        TEXT,
              dens_agencias       NUMERIC,
              dens_pontos         NUMERIC,
              deserto_bancario    SMALLINT,
              hab_por_ponto       NUMERIC,
              credito_pc          NUMERIC,
              deposito_pc         NUMERIC,
              profundidade_pib    NUMERIC,
              credito_pib         NUMERIC,
              irpb                NUMERIC,
              rcd                 NUMERIC,
              sli_pc              NUMERIC,
              irf                 NUMERIC,
              pix_tx_pc           NUMERIC,
              pix_val_pib         NUMERIC,
              irc                 NUMERIC,
              ird                 NUMERIC,
              imb                 NUMERIC,
              imdf                NUMERIC,
              rank_imdf_nacional  INTEGER,
              rank_imdf_uf        INTEGER,
              cluster_id          SMALLINT
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS fato_serie_3pontos (
              municipio_id  TEXT REFERENCES dim_municipio(municipio_id),
              ponto         TEXT NOT NULL,
              data_ref      TEXT,
              indicador     TEXT NOT NULL,
              valor         NUMERIC,
              PRIMARY KEY (municipio_id, ponto, indicador)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS dim_cluster (
              cluster_id    SMALLINT PRIMARY KEY,
              rotulo        TEXT,
              n_municipios  INTEGER,
              perfil        JSONB
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS meta_imdf (
              indice        TEXT NOT NULL,
              variavel      TEXT NOT NULL,
              carga         NUMERIC,
              variancia_exp NUMERIC,
              versao        TEXT NOT NULL,
              PRIMARY KEY (indice, variavel, versao)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS meta_fonte_variavel (
              variavel      TEXT PRIMARY KEY,
              fonte         TEXT,
              natureza      TEXT,
              periodicidade TEXT,
              verificar     BOOLEAN DEFAULT FALSE
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS meta_dataset_version (
              versao        TEXT PRIMARY KEY,
              data_exec     TIMESTAMPTZ,
              data_ref_t0   TEXT,
              n_municipios  INTEGER,
              relabel_map   JSONB,
              notas         TEXT
            )
        """)

        # Indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_serie_ind
              ON fato_serie_3pontos (indicador, ponto)
        """)

        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_fato_cluster
              ON fato_indicadores_municipio (cluster_id)
        """)

    conn.commit()
