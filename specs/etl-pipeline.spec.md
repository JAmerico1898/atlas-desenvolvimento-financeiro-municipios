# etl-pipeline.spec

Pipeline Python que ingere as fontes, calcula indicadores e publica os snapshots no Neon. Idempotente e reprodutível. Mapeia para `pipeline/` (ver CLAUDE.md).

## Princípios
- **Idempotência:** cada execução produz um snapshot completo e o substitui transacionalmente.
- **Reprodutibilidade:** bruto versionado em `data/raw/` com manifest (URL, data, hash).
- **Falha cedo:** o `qa` reprova → pipeline aborta antes de publicar.
- **Datas-base:** define `t0` (ESTBAN mais recente), `t_12`, `t_24`.

## Estágios

### 1. `ingest/`
- Utiliza arquivos prontos.
- Saída: arquivos em `data/raw/<fonte>/<data_ref>/`.

### 2. `transform/`
- **Reconciliação de chaves:** mapeia códigos de cada fonte para **IBGE 7 dígitos**; trata municípios criados/alterados por período.
- Limpeza: tipos, normalização de nomes/UF, deduplicação, marcação de zeros estruturais.
- Junta tudo num painel base por `(municipio_id, data_ref, fonte)`.
- Saída: `painel_base` (DataFrame/Parquet intermediário).

### 3. `indicators/`
- Calcula indicadores conforme `indicators.spec` (log, z-score, winsor).
- PCA: `imb` e `imdf` (persistir cargas + variância).
- Clusters: k-means + **realinhamento de rótulos** vs. snapshot anterior.
- Monta os 3 pontos (`t0`, `t_12`, `t_24`).
- Saída: DataFrames prontos para as tabelas Neon.

### 4. `qa/`
- Executa `qa-validation.spec`. Retorna pass/fail + relatório.

### 5. `publish/`
- Conecta ao Neon (`NEON_DATABASE_URL`).
- Em transação: trunca/recria e insere `dim_municipio`, `fato_indicadores_municipio`, `fato_serie_3pontos`, `agg_referencia`, `dim_cluster`, `meta_imdf`, `meta_fonte_variavel`.
- Registra versão em `meta_dataset_version` (data, hash, contagens).
- Geo: gera/atualiza TopoJSON em `web/public/geo/` (fora do banco).

## Dependências
`pandas`, `numpy`, `scikit-learn` (PCA, KMeans), `scipy` (opcional), `psycopg`/`sqlalchemy`, `topojson`/`geopandas` (geo). Pin de versões em `pipeline/requirements.txt`.

## Realinhamento de clusters (detalhe)
Após o k-means, calcular o perfil (médias por cluster) e parear cada cluster novo ao mais próximo do snapshot anterior (distância entre centroides padronizados / assignment húngaro), reatribuindo o número do rótulo. Guardar mapa de relabel em `meta_dataset_version`.

## Funções utilitárias esperadas
- `winsorize(x, p=(0.01, 0.99))`.
- `zscore(x)`, `safe_ratio(num, den)` (retorna NULL se den ≤ 0).
