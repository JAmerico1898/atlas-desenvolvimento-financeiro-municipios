# map.spec

Mapa coroplético da Visão Brasil. Geometria via TopoJSON estático; valores via API.

## Geometria
- Fonte: Malha Municipal do IBGE.
- **Simplificação:** `toposimplify` para reduzir vértices; gerar 2–3 níveis de detalhe por zoom (LOD). A malha cheia é pesada demais para o navegador.
- Formato: **TopoJSON** em `web/public/geo/municipios-{lod}.topojson`, chave de junção = `municipio_id` (IBGE 7 dígitos).
- Não armazenar geometria no Neon.

## Biblioteca
- **MapLibre GL** (coroplético leve) como padrão; deck.gl como alternativa se precisar de performance extra com milhares de polígonos.

## Dados de valor
- `GET /api/nacional/mapa?indicador=&ponto=` retorna `{ dominio:{min,p1,p99,max}, valores:[{municipio_id, valor, faixa}] }`.
- Junção no cliente: `municipio_id` do TopoJSON ↔ `municipio_id` da resposta.

## Escala de cor
- **Domínio winsorizado** (p1–p99) para evitar que outliers (ex.: capitais financeiras) achatem a escala.
- Escala sequencial para indicadores contínuos (ex.: `credito_pib`, `imdf`); divergente quando houver ponto neutro (ex.: `irpb` em torno de 1; `sli_pc` em torno de 0).
- Classes por quantis ou cortes naturais; legenda com faixas e nota da data de referência.
- `deserto_bancario`: camada categórica (binária) com padrão próprio (hachura/cor sólida), não escala contínua.

## Interações
- Hover: tooltip com nome, UF, valor formatado (pt-BR) e ponto temporal.
- Clique: navega para `/municipio/[codigo]`.
- Seletor de **indicador** e de **ponto** (t0/t_12/t_24).
- Sincronização: indicador selecionado persiste ao voltar para o painel do município (querystring).

## Acessibilidade
- Alternativa não-visual: tabela/ranking equivalente (`/brasil/ranking`).
- Tooltip legível por leitor de tela; legenda com rótulos textuais das faixas.

## Performance
- Servir TopoJSON LOD por zoom; carregar valores separados da geometria (cacheável).
- Memoizar junção; evitar recolorir todos os polígonos a cada hover.
