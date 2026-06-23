# CLAUDE.md — Atlas de Desenvolvimento Financeiro dos Municípios

Documento-âncora do projeto. Orquestra as demais specs em `/specs`. Leia este arquivo primeiro.

## Visão geral
App nacional que apresenta, por município brasileiro, indicadores de acesso, profundidade, intermediação, digitalização e desigualdade financeira, mais índices-síntese. Dois pilares de peso igual: **Painel do Município** (porta de entrada via busca) e **Visão Brasil** (mapas, ranking, clusters, desigualdade), interligados.

## Stack
- **Front-end:** Next.js (App Router) + React + Tailwind. Mapa: MapLibre GL. Gráficos: Recharts. Deploy: Vercel.
- **Banco:** Neon (Postgres serverless), tabelas read-only para o app.
- **Pipeline de dados:** bases disponibilizadas.
- **Geo:** TopoJSON estático servido pelo Vercel (não no banco).

## Decisões travadas
- **Série temporal = 3 pontos**: data-base (`t0`), 12 meses antes (`t_12`), 24 meses antes (`t_24`). Sem histórico completo.
- **Geo**: TopoJSON estático (sem PostGIS).
- **Clusters**: recalculados a cada atualização, com realinhamento de rótulos por similaridade de perfil entre execuções.
- **Sem cooperativismo** e **sem cruzamentos da agenda de pesquisa** (CadÚnico/MapBiomas/S2ID).
- **Chave universal**: código IBGE do município (7 dígitos), tipo texto.

## Estrutura de pastas
```
odfm/
├── CLAUDE.md
├── specs/                     # specs deste diretório
├── pipeline/                  # ETL Python
│   ├── transform/             # limpeza + reconciliação de chaves
│   ├── indicators/            # cálculo de indicadores, PCA, Gini, Theil, clusters
│   ├── qa/                    # validações
│   └── publish/               # escrita no Neon
├── data/
│   ├── raw/                   # bruto versionado (gitignored, exceto manifests)
│   └── geo/                   # malha → TopoJSON simplificado
├── web/                       # Next.js
    ├── app/                   # rotas (App Router)
    ├── components/
    ├── lib/                   # acesso a dados, formatadores
    └── public/geo/            # TopoJSON publicado
```

## Convenções
- Chaves de indicador em `snake_case`, idênticas entre `indicators.spec`, `database-schema.spec` e `api-contract.spec`.
- Datas de referência explícitas por família de indicador (mensal vs. anual).
- Toda escrita no Neon é transacional e idempotente (substitui o snapshot por versão).

## Ordem de leitura recomendada das specs
1. `data-sources.spec` → 2. `indicators.spec` → 3. `etl-pipeline.spec` → 4. `database-schema.spec` → 5. `qa-validation.spec` → 6. `api-contract.spec` → 7. `app-routes-ui.spec` → 8. `map.spec` → 9. `update-workflow.spec`.
