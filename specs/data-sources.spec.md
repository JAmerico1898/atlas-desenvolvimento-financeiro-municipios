# data-sources.spec

Catálogo de fontes de dados do ODFM. Chave universal: **código IBGE (7 dígitos, texto)**.

## Fontes núcleo (MVP)

### ESTBAN — Banco Central
- **Variáveis:** 
`saldo_credito`: coluna `VERBETE_160_OPERACOES_DE_CREDITO` do arquivo municipios-saldos.csv
`dep_vista`: coluna `VERBETE_401_SERVICOS_PUBLICOS + VERBETE_402_ATIVIDADES_EMPRESARIAIS + VERBETE_403_ESPECIAIS_DO_TESOURO_NACIONAL + VERBETE_404_SALDOS_CREDORES_EM_CONTAS_DE_EMPRESTIMOS_E_FINAN + VERBETE_411_DE_PESSOAS_FISICAS + VERBETE_412_DE_PESSOAS_JURIDICAS + VERBETE_413_DE_INSTITUICOES_FINANCEIRAS + VERBETE_414_JUDICIAIS + VERBETE_415_OBRIGATORIOS + VERBETE_416_PARA_INVESTIMENTOS + VERBETE_417_VINCULADOS + VERBETE_418_DEMAIS_DEPOSITOS + VERBETE_419_SLD_CRED_CTAS_EMPR_FINANC_OUTR` do arquivo municipios-saldos.csv
`dep_poupanca`: coluna `VERBETE_420_DEPOSITOS_DE_POUPANCA` do arquivo municipios-saldos.csv
`dep_prazo`: `VERBETE_432_DEPOSITOS_A_PRAZO` do arquivo municipios-saldos.csv
`num_agencias`: contagem da coluna `CODMUN_IBGE`do arquivo municipios-agencia.csv
- **Granularidade / periodicidade:** município / mensal.
- **Natureza:** estoque (saldos contábeis em data-base).
- **Chave:** código do município (reconciliar para IBGE 7 dígitos) (coluna `CODMUN_IBGE`do arquivo municipios-agencia.csv; e coluna `CODMUN_IBGE`do arquivo municipios-saldos.csv)  
- **Observações:** não contém número de contas/clientes. Verbetes de balancete agregados.

### Estatísticas Pix — Banco Central
- **Variáveis:** `pix_qtd_transacoes` (soma das colunas `Quantidade de Transações Pagador PF`, `Quantidade de Transações Pagador PJ`, `Quantidade de Transações Recebedor PF`, `Quantidade de Transações Recebedor PJ` do arquivo "\public\data\pix_municipios.db"), `pix_valor` (soma das colunas `Valor Pagador PF`, `Valor Pagador PJ`, `Valor Recebedor PF`, `Valor Recebedor PJ` do arquivo "\public\data\pix_municipios.db").
- **Granularidade / periodicidade:** município / mensal ou trimestral.
- **Natureza:** fluxo.
- **Flag:** **verificar** — granularidade municipal e definição de município (pagador/recebedor). Não presumir "usuários únicos" por município.

### IBGE
- **População:** coluna`POPULAÇÃO` do arquivo municipios-populacao.xls. Estimativas (anual).  Municípios identificados pela coluna `Código do Município`, municípios identificados pela coluna `CODMUN_IBGE`
- **PIB:** `pib` municipal (preços correntes), 2023, coluna `Produto Interno Bruto, a preços correntes (R$ 1.000)` do arquivo municipios-pib.xlsx.
- **Malha municipal:** geometrias → simplificar para TopoJSON (ver `map.spec`). municípios no diretório "\municipios-malha-territorial" e estados (ou UF) no diretório "\uf-malha-territorial"

## Fontes complementares

### Canais de atendimento — Banco Central
- **Variáveis:** `num_postos`, totalização da coluna identificadora de municípios `MUNICIPIO IBGE` no arquivo municipios-postos.xlsx por data; e `num_paes`, totalização da coluna identificadora de municípios `MUNICIPIO IBGE` no arquivo municipios-pae.xlsx por data
- **Periodicidade:** mensal.

### Atlas do Desenvolvimento Humano (PNUD/Ipea/FJP)
- **Variáveis:** `ifdm` (arquivo municipios-ifdm.xlsx), `ifdm_emprego_renda` (arquivo municipios-ifdm.xlsx).
- **Periodicidade:** 2023.

## Catálogo de variáveis (alimenta `meta_fonte_variavel`)

| variavel | fonte | natureza | periodicidade | verificar |
|---|---|---|---|---|
| saldo_credito | ESTBAN/BCB | estoque | mensal | não |
| dep_vista | ESTBAN/BCB | estoque | mensal | não |
| dep_poupanca | ESTBAN/BCB | estoque | mensal | não |
| dep_prazo | ESTBAN/BCB | estoque | mensal | não |
| num_agencias | ESTBAN/BCB | estoque | mensal | não |
| pix_qtd_transacoes | Pix/BCB | fluxo | mensal/trim | não |
| pix_valor | Pix/BCB | fluxo | mensal/trim | não |
| num_postos | Canais/BCB | estoque | periódico | não |
| num_paes | Canais/BCB | estoque | periódico | não |
| pop_total | IBGE | — | anual | não |
| pib | IBGE | fluxo | anual | não |
| ifdm | Firjan | — | 2023 | não |
| ifdm_emprego_renda | Firjan | — | 2023 | não |
| malha | IBGE | geo | por edição | não |

## Datas de referência
Cada família carrega sua `data_ref`. O snapshot `t0` usa a ESTBAN mais recente; PIB/IDHM usam a edição vigente mais próxima (anual/decenal), explicitada em cada cartão da UI.
