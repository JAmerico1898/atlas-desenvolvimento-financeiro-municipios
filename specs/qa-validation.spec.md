# qa-validation.spec

Regras de validação executadas no estágio `qa/` do pipeline. Reprovação aborta a publicação.

## Categorias

### Cobertura
- Contagem de municípios em `dim_municipio` ≈ 5.570 (tolerância configurável). Falha se desvio > limiar.
- Todo `municipio_id` em `fato_indicadores_municipio` existe em `dim_municipio` (integridade referencial).
- Cada `municipio_id` aparece em `fato_serie_3pontos` para os pontos esperados (quando a fonte é mensal).

### Chaves e tipos
- `municipio_id` com 7 dígitos numéricos (texto). Sem nulos/duplicatas em PKs.
- `uf` ∈ 27 unidades; `regiao` ∈ {Norte, Nordeste, Centro-Oeste, Sudeste, Sul}.

### Faixas plausíveis
- `irf` ∈ [0, 1].
- `imdf`, `imb`: distribuição centrada (z); sinalizar se média muito distante de 0.
- `irpb`, `irc`, `ird` > 0.
- `pop_total`, `pib` > 0 onde houver dado.
- `credito_pib` ≥ 0 (pré-condição do Theil).

### Tratamento de zeros/indefinidos
- `rcd` = NULL exatamente quando `depositos_total = 0`.
- `hab_por_ponto` = NULL exatamente quando `(num_agencias + num_postos) = 0`.
- `deserto_bancario` = 1 exatamente nesse mesmo conjunto.
- Consistência: todo `deserto_bancario = 1` ⇒ `hab_por_ponto IS NULL`.

### Nulos esperados vs. inesperados
- Variáveis com flag **verificar** (Pix, correspondentes) podem vir nulas: registrar cobertura (% preenchido), não falhar — mas marcar em `meta_fonte_variavel`.
- Variáveis núcleo (ESTBAN, pop, PIB) com nulos acima de limiar ⇒ falha.

### PCA
- Variância explicada pelo 1º componente registrada; alertar (não necessariamente falhar) se < limiar (ex.: 40%).
- Sinais das cargas coerentes entre execuções (alerta se invertem sem explicação).

### Versão
- `meta_dataset_version` preenchida (data_exec, data_ref_t0, n_municipios, relabel_map).

## Saída
Relatório estruturado (JSON) com pass/fail por regra + métricas de cobertura. Em falha de regra crítica, abortar antes do `publish/`. Anexar relatório ao run do GitHub Actions.

## Testes automatizados (código)
- Unit tests das utilitárias: `winsorize`, `safe_ratio` (casos com zero/negativo).
- Teste de fumaça: pipeline ponta-a-ponta num município sintético + um mês.
