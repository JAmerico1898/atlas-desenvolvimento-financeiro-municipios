# indicators.spec

Definição formal dos indicadores do ADFM. Tradução direta do documento de indicadores. Cada indicador tem: chave, fórmula, transformação, tratamento de zeros/outliers e dependências.

## Convenções de cálculo
- **Per capita / densidades:** denominador = `pop_total` (per capita), por 10.000 quando densidade.
- **Transformação:** log nas monetárias (crédito, depósitos, PIB, valor Pix) antes de padronizar.
- **Padronização:** z-score em todas as variáveis antes de PCA.
- **Winsorização:** cortes em p1/p99 nas variáveis e nas escalas de cor.
- **Estoque × fluxo:** nunca dividir fluxo por estoque, exceto a exceção consagrada `credito_pib` (estoque/fluxo), com data de referência fixada.
- **Zeros:** quando o denominador pode ser nulo (agências, depósitos), usar diferença/saldo líquido ou flag categórico em vez de razão divergente.

## Dimensão 1 — Acesso físico
| chave | fórmula | trat. zeros/outliers | dependências |
|---|---|---|---|
| `dens_agencias` | `num_agencias / pop_total` | winsor p99 | num_agencias, pop_total |
| `dens_pontos` | `(num_agencias + num_postos + num_paes) / pop_total * 10000` | winsor p99; **verificar** fontes | num_postos, num_correspondentes, pop_total |
| `deserto_bancario_flag` | categórico: `1` se `(num_agencias + num_postos) = 0`, senão `0` | sem divisão | num_agencias, num_postos |
| `hab_por_ponto` | `pop_total / (num_agencias + num_postos)` **somente se denominador > 0** | indefinido (NULL) se 0; winsor p99 | pop_total, num_agencias, num_postos |

## Dimensão 2 — Profundidade e uso
| chave | fórmula | trat. | dependências |
|---|---|---|---|
| `credito_pc` | `saldo_credito / pop_total` | log, winsor | saldo_credito, pop_total |
| `deposito_pc` | `(dep_vista + dep_poupanca + dep_prazo) / pop_total` | log, winsor | depósitos, pop_total |
| `profundidade_pib` | `(saldo_credito + depositos_total) / pib` | winsor | crédito, depósitos, pib |
| `credito_pib` | `saldo_credito / pib` | winsor; data-ref fixada (dez × PIB anual ou média 12m) | saldo_credito, pib |
| `irpb` | `credito_pib_i / credito_pib_nacional` | — | credito_pib, agregado nacional |

`credito_pib_nacional = Σ saldo_credito / Σ pib` (agregado, não média de razões).

## Dimensão 3 — Intermediação e retenção
| chave | fórmula | trat. | dependências |
|---|---|---|---|
| `rcd` | `saldo_credito / depositos_total` | winsor; NULL se depósitos = 0 | crédito, depósitos |
| `sli_pc` | `(saldo_credito - depositos_total) / pop_total` | winsor (preferido à razão) | crédito, depósitos, pop_total |
| `irf` | `1 - |saldo_credito - depositos_total| / (saldo_credito + depositos_total)` | limitado 0–1; robusto | crédito, depósitos |

## Dimensão 4 — Digitalização (fluxo)
| chave | fórmula | trat. | dependências |
|---|---|---|---|
| `pix_tx_pc` | `pix_qtd_transacoes / pop_total` | **verificar** fonte | pix_qtd_transacoes, pop_total |
| `pix_val_pib` | `pix_valor / pib` | **verificar** fonte | pix_valor, pib |

## Dimensão 5 — Desigualdade relativa
| chave | fórmula | trat. | dependências |
|---|---|---|---|
| `irc` | `credito_pc_i / média nacional de credito_pc` | — | credito_pc |
| `ird` | `deposito_pc_i / média nacional de deposito_pc` | — | deposito_pc |
| `resid_imb_idhm` | resíduo de `imb = α + β·ifdm + ε` | requer imb e idhm | imb, idhm |

## Índices-síntese
### `imb` — Índice Municipal de Bancarização (PCA)
Variáveis padronizadas (log nas monetárias): `dens_agencias`, `dens_pontos`, `dens_pix_usuarios`* , `valor_pix_pc`*, `deposito_pc`.
\*Itens de Pix dependem da verificação de fonte; se indisponível, usar subconjunto e registrar em `meta_imdf`. **Cooperados removido.**
Retém o 1º componente. Persistir cargas + variância explicada.

### `imdf` — Índice Municipal de Desenvolvimento Financeiro (PCA)
Variáveis padronizadas: `credito_pc`, `deposito_pc`, `dens_agencias`, `dens_pontos`, `pix_tx_pc`, `profundidade_pib`. Retém o 1º componente (escore). Persistir cargas + variância em `meta_imdf`.

## Agregados nacionais/regionais (tabela `agg_referencia`)
| chave | definição |
|---|---|
| `media_nacional_<indicador>` | média (ou agregado) nacional por período |
| `media_regional_<indicador>` | idem por macrorregião |

## Clusters
k-means (ou hierárquico) sobre o vetor padronizado das dimensões 1–4 + `imdf`. **Recalculado a cada atualização**; rótulos realinhados por similaridade de centroide/perfil ao snapshot anterior para estabilidade visual. Persistir atribuição + perfil em `dim_cluster`.

## Saída
Cada indicador é calculado para `t0`, `t_12`, `t_24` quando a fonte for mensal; anuais/decenais usam a edição vigente em cada janela. Resultado alimenta `fato_indicadores_municipio` (t0) e `fato_serie_3pontos` (3 pontos).
