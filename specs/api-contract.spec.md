# api-contract.spec

Endpoints servidos pelo Next.js (API Routes), lendo do Neon. Respostas JSON. Chaves de indicador conforme `indicators.spec`.

## Convenções
- Base: `/api`. Erros: `{ error: { code, message } }` com status HTTP adequado.
- `municipio_id` = IBGE 7 dígitos. Indicadores referenciados pela chave snake_case.
- Respostas do snapshot vigente; cabeçalho `X-Dataset-Version` com a versão.

## Município

### `GET /api/municipios/search`
Busca/autocomplete.
- Query: `q` (texto), `uf` (opcional), `limit` (default 10).
- Resposta: `[{ municipio_id, nome, uf, regiao }]`.

### `GET /api/municipios/{municipio_id}`
Painel completo do município.
- Resposta:
```json
{
  "municipio": { "municipio_id": "...", "nome": "...", "uf": "...", "regiao": "...",
                 "pop_total": 0, "pib": 0, "ano_ref_pib": 0,
                 "idhm": 0 },
  "indicadores": { "dens_agencias": 0, "credito_pib": 0, "irpb": 0, "imdf": 0,
                   "rank_imdf_nacional": 0, "rank_imdf_uf": 0, "deserto_bancario": 0, "...": 0 },
  "serie3": { "credito_pib": [{"ponto":"t_24","data_ref":"...","valor":0}, "..."], "...": [] },
  "cluster": { "cluster_id": 0, "rotulo": "...", "perfil": {} },
  "referencia": { "nacional": { "credito_pib": 0, "...": 0 },
                  "regiao": { "credito_pib": 0, "...": 0 } },
  "fontes_verificar": ["pix_tx_pc", "dens_pontos"]
}
```

## Visão Brasil

### `GET /api/nacional/mapa`
Valores por município para coroplético.
- Query: `indicador` (obrigatório), `ponto` (default `t0`).
- Resposta: `{ indicador, ponto, dominio: {min, p1, p99, max}, valores: [{ municipio_id, valor, faixa }] }`.

### `GET /api/nacional/ranking`
- Query: `indicador`, `uf` (opcional), `regiao` (opcional), `ordem` (`desc|asc`), `page`, `page_size`.
- Resposta: `{ total, page, items: [{ posicao, municipio_id, nome, uf, valor }] }`.

### `GET /api/nacional/clusters`
- Resposta: `[{ cluster_id, rotulo, n_municipios, perfil }]`.


### `GET /api/nacional/imdf`
- Resposta: `{ distribuicao: [...], cargas: [{ variavel, carga }], variancia_exp: 0 }`.

## Metadados

### `GET /api/meta/fontes`
- Resposta: catálogo `meta_fonte_variavel` (variável, fonte, natureza, periodicidade, verificar).

### `GET /api/meta/version`
- Resposta: `{ versao, data_exec, data_ref_t0, n_municipios }`.

## Cache
- Endpoints nacionais: cache/ISR (revalidação no fim do pipeline). Município: SSG+ISR (ver `app-routes-ui.spec`).
- `search`: dinâmico, baixa latência (índice em memória ou query simples).
