# app-routes-ui.spec

Rotas, páginas, componentes e estados do front-end (Next.js App Router). Deriva do design. Dois pilares interligados: Município e Brasil.

## Rotas
| rota | descrição | render |
|---|---|---|
| `/` | Home + busca de município | estático |
| `/municipio/[codigo]` | Painel do município | SSG + ISR |
| `/brasil` | Hub da Visão Brasil (redireciona p/ `/brasil/mapa`) | estático |
| `/brasil/mapa` | Mapa de calor por indicador | ISR |
| `/brasil/ranking` | Ranking nacional | ISR |
| `/brasil/clusters` | Clusters de municípios | ISR |
| `/brasil/imdf` | IMDF nacional + cargas PCA | ISR |
| `/metodologia` | Princípios e fórmulas (do documento) | estático |
| `/sobre` | Fontes, flags de verificação, versão | estático |

## Geração das páginas de município
- ~5.570 municípios: pré-renderizar os mais acessados; demais via ISR sob demanda.
- `generateStaticParams` para os principais; fallback ISR para o resto.
- Revalidação acionada no fim do pipeline (ver `update-workflow.spec`).

## Componentes principais
### Home
- `MunicipioSearch` — input com autocomplete (`/api/municipios/search`), resolve homônimos por UF.
- `QuickLinks` — atalhos: mapa nacional, ranking IMDF, metodologia.

### Painel do Município (`/municipio/[codigo]`)
- `PanelHeader` — nome, UF, região, população, PIB; cartão IMDF + `RankBadge` (nacional/UF); `RelativeGauge`.
- `DimensionCard` (reutilizável) por dimensão D1–D5, cada um com indicadores e leitura interpretativa.
  - D2 destaca `credito_pib` com `RelativeGauge(irpb)` (acima/abaixo de 1).
- `Comparador` — radar/barras: município vs. nacional, região e cluster.
- `Serie3Chart` — 3 pontos (t_24, t_12, t0) dos indicadores-chave.
- `DataSheet` — valores brutos, fontes por variável, download CSV/JSON.
- `VerifyNotice` — aviso discreto nos módulos com flag verificar (Pix, correspondentes).
- `CrossLink` — "ver este indicador no mapa nacional" → `/brasil/mapa?indicador=...`.

### Visão Brasil
- `ChoroplethMap` — ver `map.spec`. Seletor de indicador e de ponto (t0/t_12/t_24).
- `RankingTable` — paginada, filtros UF/região, ordenação.
- `ClusterView` — perfis dos clusters + contagem; clicar leva a municípios do cluster.
- `ImdfPanel` — distribuição, cargas do PCA, variância explicada.
- `MapToMunicipio` — clique no mapa/ranking → `/municipio/[codigo]`.

## Estados
- Loading skeletons por módulo (carregamento progressivo, não bloquear a página toda).
- Estado "dado indisponível" para variáveis com flag verificar (em vez de zero).
- Erro de município inexistente → sugestões.

## Navegação
- Header com dois pilares: **Município** (busca) e **Brasil**. Persistência do indicador selecionado ao alternar pilares (querystring).

## Acessibilidade e i18n
- Contraste AA; mapa com leitura alternativa (tabela/tooltip).
- Números em pt-BR (separador de milhar/decimal). Datas de referência visíveis por cartão.
