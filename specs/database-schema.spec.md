# database-schema.spec

Schema Neon (Postgres) do ODFM. Tabelas read-only para o app; reescritas pelo pipeline. `municipio_id` = código IBGE (texto, 7 dígitos).

## DDL

```sql
-- Dimensão município
CREATE TABLE dim_municipio (
  municipio_id   TEXT PRIMARY KEY,           -- IBGE 7 dígitos
  nome           TEXT NOT NULL,
  uf             TEXT NOT NULL,
  regiao         TEXT NOT NULL,
  lat            DOUBLE PRECISION,
  lon            DOUBLE PRECISION,
  pop_total      INTEGER,
  pib            NUMERIC,
  ano_ref_pib    SMALLINT,
  ifdm           NUMERIC,
  ifdm-emprego-renda     NUMERIC
);

-- Snapshot t0: todos os indicadores por município
CREATE TABLE fato_indicadores_municipio (
  municipio_id        TEXT REFERENCES dim_municipio(municipio_id),
  data_ref_estban     DATE,
  data_ref_pix        DATE,
  -- D1
  dens_agencias       NUMERIC,
  dens_pontos         NUMERIC,
  deserto_bancario    SMALLINT,    -- flag 0/1
  hab_por_ponto       NUMERIC,     -- NULL se sem pontos
  -- D2
  credito_pc          NUMERIC,
  deposito_pc         NUMERIC,
  profundidade_pib    NUMERIC,
  credito_pib         NUMERIC,
  irpb                NUMERIC,
  -- D3
  rcd                 NUMERIC,     -- NULL se depósitos = 0
  sli_pc              NUMERIC,
  irf                 NUMERIC,
  -- D4
  pix_tx_pc           NUMERIC,
  pix_val_pib         NUMERIC,
  -- D5
  irc                 NUMERIC,
  ird                 NUMERIC,
  resid_imb_idhm      NUMERIC,
  -- síntese
  imb                 NUMERIC,
  imdf                NUMERIC,
  rank_imdf_nacional  INTEGER,
  rank_imdf_uf        INTEGER,
  cluster_id          SMALLINT,
  PRIMARY KEY (municipio_id)
);

-- Série de 3 pontos (long): t0, t_12, t_24
CREATE TABLE fato_serie_3pontos (
  municipio_id   TEXT REFERENCES dim_municipio(municipio_id),
  ponto          TEXT NOT NULL,   -- 't0' | 't_12' | 't_24'
  data_ref       DATE,
  indicador      TEXT NOT NULL,   -- chave do indicador
  valor          NUMERIC,
  PRIMARY KEY (municipio_id, ponto, indicador)
);

-- Clusters
CREATE TABLE dim_cluster (
  cluster_id     SMALLINT PRIMARY KEY,
  rotulo         TEXT,            -- nome descritivo do perfil
  n_municipios   INTEGER,
  perfil         JSONB            -- médias por indicador
);

-- Metadados do IMDF/IMB (cargas do PCA)
CREATE TABLE meta_imdf (
  indice         TEXT NOT NULL,   -- 'imdf' | 'imb'
  variavel       TEXT NOT NULL,
  carga          NUMERIC,
  variancia_exp  NUMERIC,         -- variância explicada pelo 1º componente
  versao         TEXT NOT NULL,
  PRIMARY KEY (indice, variavel, versao)
);

-- Catálogo de variáveis e flags de verificação
CREATE TABLE meta_fonte_variavel (
  variavel       TEXT PRIMARY KEY,
  fonte          TEXT,
  natureza       TEXT,            -- estoque | fluxo | -
  periodicidade  TEXT,
  verificar      BOOLEAN DEFAULT FALSE
);

-- Versão do dataset
CREATE TABLE meta_dataset_version (
  versao         TEXT PRIMARY KEY,   -- timestamp/hash
  data_exec      TIMESTAMPTZ,
  data_ref_t0    DATE,
  n_municipios   INTEGER,
  relabel_map    JSONB,              -- mapa de realinhamento de clusters
  notas          TEXT
);
```

## Índices
```sql
CREATE INDEX idx_serie_ind      ON fato_serie_3pontos (indicador, ponto);
CREATE INDEX idx_fato_cluster   ON fato_indicadores_municipio (cluster_id);
CREATE INDEX idx_fato_uf        ON dim_municipio (uf);
CREATE INDEX idx_agg_ind        ON agg_referencia (indicador, ponto);
```

## Notas
- Geometria **não** vive no banco (TopoJSON estático). `dim_municipio` guarda só centroide (`lat`,`lon`).
- `rank_imdf_*` pré-calculados pelo pipeline para evitar ordenação cara no app.
- Reescrita transacional por versão; app sempre lê o snapshot vigente.
