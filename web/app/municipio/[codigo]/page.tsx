import { notFound } from 'next/navigation'
import { getMunicipio } from '@/lib/queries'
import PanelHeader from '@/components/PanelHeader'
import DimensionCard from '@/components/DimensionCard'
import SaveLastMunicipio from '@/components/SaveLastMunicipio'
import Link from 'next/link'

export const revalidate = 3600

export default async function MunicipioPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const data = await getMunicipio(codigo)
  if (!data) notFound()

  const { municipio, indicadores, dimRanks } = data
  const ind = indicadores ?? {}

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem' }}>
      <SaveLastMunicipio codigo={codigo} nome={(municipio as any).nome ?? ''} uf={(municipio as any).uf ?? ''} />
      <PanelHeader
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        municipio={municipio as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        indicadores={ind as any}
        rankImb={dimRanks?.rank_imb ?? null}
        rankPop={dimRanks?.rank_pop ?? null}
        rankPib={dimRanks?.rank_pib ?? null}
      />

      {/* Breadcrumb / crosslink */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link href={`/brasil/mapa?indicador=imdf&destaque=${codigo}`} style={{ color: 'var(--navy)', fontSize: '0.875rem' }}>
          → Ver no mapa nacional
        </Link>
        <Link href={`/brasil/ranking?indicador=imdf`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Ranking nacional
        </Link>
      </div>

      {/* Dimensions — vertical stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
        <DimensionCard
          title="D1 — Acesso Físico"
          description="Presença de pontos de atendimento financeiro no território"
          municipioId={codigo}
          indicators={[
            {
              chave: 'dens_agencias', label: 'Agências por 10 mil hab.', value: ind.dens_agencias, format: 'decimal',
              rank: dimRanks?.rank_dens_agencias ?? null,
              help: 'Número de agências bancárias para cada 10 mil habitantes. Mede a presença de infraestrutura financeira formal no município.',
            },
            {
              chave: 'dens_pontos', label: 'Pontos totais por 10 mil hab.', value: ind.dens_pontos, format: 'decimal',
              rank: dimRanks?.rank_dens_pontos ?? null,
              help: 'Total de pontos de atendimento financeiro (agências + postos de atendimento) por 10 mil habitantes. PAEs não incluídos.',
            },
            {
              chave: 'deserto_bancario', label: 'Deserto bancário', value: ind.deserto_bancario, format: 'integer',
              help: '1 = município sem nenhum ponto de atendimento bancário registrado no período; 0 = possui ao menos um ponto.',
            },
            {
              chave: 'hab_por_ponto', label: 'Habitantes por ponto de acesso', value: ind.hab_por_ponto, format: 'compact',
              rank: dimRanks?.rank_hab_por_ponto ?? null,
              help: 'Inverso da densidade de pontos. Quanto maior o valor, maior o número de habitantes por ponto de acesso e menor a disponibilidade de serviços financeiros. Ranking: posição 1 = menor número de habitantes por ponto (melhor cobertura).',
            },
          ]}
        />
        <DimensionCard
          title="D2 — Profundidade e Uso"
          description="Volume de crédito e depósitos em relação à economia local"
          municipioId={codigo}
          indicators={[
            {
              chave: 'credito_pc', label: 'Crédito per capita (R$)', value: ind.credito_pc != null ? Number(ind.credito_pc) : null, format: 'currency-compact',
              rank: dimRanks?.rank_credito_pc ?? null,
              help: 'Saldo total de crédito concedido no município dividido pela população. Mede o volume médio de crédito disponível por habitante.',
            },
            {
              chave: 'deposito_pc', label: 'Depósitos per capita (R$)', value: ind.deposito_pc != null ? Number(ind.deposito_pc) : null, format: 'currency-compact',
              rank: dimRanks?.rank_deposito_pc ?? null,
              help: 'Total de depósitos captados (à vista + poupança + a prazo) dividido pela população. Indica a capacidade de poupança e acesso a serviços de depósito no município.',
            },
            {
              chave: 'credito_pib', label: 'Crédito / PIB', value: ind.credito_pib, format: 'decimal', gauge: { value: ind.irpb ?? 0, reference: 1 },
              rank: dimRanks?.rank_credito_pib ?? null,
              help: 'Razão entre o saldo de crédito e o PIB municipal. Mede a profundidade do mercado de crédito local em relação ao tamanho da economia.',
            },
            {
              chave: 'profundidade_pib', label: 'Profundidade financeira / PIB', value: ind.profundidade_pib, format: 'decimal',
              rank: dimRanks?.rank_profundidade_pib ?? null,
              help: 'Soma de crédito e depósitos dividida pelo PIB municipal. Indicador geral de aprofundamento financeiro do município.',
            },
          ]}
        />
        <DimensionCard
          title="D3 — Intermediação"
          description="Relação entre crédito concedido e depósitos captados"
          municipioId={codigo}
          indicators={[
            {
              chave: 'rcd', label: 'Razão crédito/depósito', value: ind.rcd, format: 'decimal',
              rank: dimRanks?.rank_rcd ?? null,
              help: 'Razão Crédito/Depósito (RCD) = saldo de crédito / total de depósitos, em valores nominais. Valor > 1 indica que o sistema financeiro injeta recursos externos no município; valor < 1 indica que o município exporta poupança para outras praças.',
            },
            {
              chave: 'sli_pc', label: 'Saldo líq. de intermediação per capita (R$)', value: ind.sli_pc, format: 'currency-compact',
              rank: dimRanks?.rank_sli_pc ?? null,
              help: 'Saldo Líquido de Intermediação per capita = (crédito − depósitos) / população, em valores nominais (R$). Positivo: o município recebe mais crédito do que deposita. Negativo: exporta poupança para outras praças.',
            },
            {
              chave: 'irf', label: 'Índice de retenção financeira', value: ind.irf, format: 'decimal',
              rank: dimRanks?.rank_irf ?? null,
              help: 'Índice de Retenção Financeira = 1 − |crédito − depósitos| / (crédito + depósitos), calculado em valores nominais. Varia de 0 a 1: próximo a 1 indica equilíbrio entre crédito e depósitos locais; próximo a 0 indica grande desequilíbrio — excesso de crédito externo ou de poupança não reinvestida localmente.',
            },
          ]}
        />
        <DimensionCard
          title="D4 — Digitalização"
          description="Adoção de pagamentos digitais via Pix"
          municipioId={codigo}
          indicators={[
            {
              chave: 'pix_tx_pc', label: 'Transações Pix per capita', value: ind.pix_tx_pc, format: 'decimal',
              rank: dimRanks?.rank_pix_tx_pc ?? null,
              help: 'Número de transações Pix realizadas por pagadores domiciliados no município, dividido pela população. Mede a adoção de meios de pagamento digital (fonte: BCB, lado pagador).',
            },
            {
              chave: 'pix_val_pib', label: 'Valor Pix / PIB', value: ind.pix_val_pib, format: 'decimal',
              rank: dimRanks?.rank_pix_val_pib ?? null,
              help: 'Valor total das transações Pix (lado pagador) dividido pelo PIB municipal. Mede a relevância econômica do Pix na atividade financeira local.',
            },
          ]}
        />
        <DimensionCard
          title="D5 — Desigualdade Relativa"
          description="Posição do município em relação à média nacional"
          municipioId={codigo}
          indicators={[
            {
              chave: 'irc', label: 'Índice relativo de crédito', value: ind.irc, format: 'decimal', gauge: { value: ind.irc ?? 0 },
              rank: dimRanks?.rank_irc ?? null,
              help: 'IRC = crédito per capita do município / média nacional. Valor > 1 indica crédito acima da média; < 1 indica abaixo. Mede a desigualdade de acesso ao crédito entre municípios.',
            },
            {
              chave: 'ird', label: 'Índice relativo de depósitos', value: ind.ird, format: 'decimal', gauge: { value: ind.ird ?? 0 },
              rank: dimRanks?.rank_ird ?? null,
              help: 'IRD = depósitos per capita do município / média nacional. Valor > 1 indica depósitos acima da média; < 1 indica abaixo.',
            },
            {
              chave: 'ifdm', label: 'IFDM', value: municipio.ifdm != null ? Number(municipio.ifdm) : null, format: 'decimal',
              rank: dimRanks?.rank_ifdm ?? null,
              noMap: true,
              help: 'Índice FIRJAN de Desenvolvimento Municipal (IFDM). Síntese de indicadores de educação, saúde e mercado de trabalho. Varia de 0 a 1, onde 1 representa o máximo desenvolvimento. Fonte: Sistema FIRJAN.',
            },
            {
              chave: 'ifdm_emprego_renda', label: 'IFDM Emprego e Renda', value: municipio.ifdm_emprego_renda != null ? Number(municipio.ifdm_emprego_renda) : null, format: 'decimal',
              rank: dimRanks?.rank_ifdm_emprego_renda ?? null,
              noMap: true,
              help: 'Sub-índice FIRJAN de Emprego e Renda. Componente do IFDM que mede a geração de emprego formal e a massa salarial no município. Varia de 0 a 1. Fonte: Sistema FIRJAN.',
            },
          ]}
        />
      </div>
    </div>
  )
}
