import { notFound } from 'next/navigation'
import { getMunicipio } from '@/lib/queries'
import PanelHeader from '@/components/PanelHeader'
import DimensionCard from '@/components/DimensionCard'
import Comparador from '@/components/Comparador'
import Serie3Chart from '@/components/Serie3Chart'
import DataSheet from '@/components/DataSheet'
import VerifyNotice from '@/components/VerifyNotice'
import Link from 'next/link'

export const revalidate = 3600

export default async function MunicipioPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const data = await getMunicipio(codigo)
  if (!data) notFound()

  const { municipio, indicadores, serie3, cluster, referencia } = data
  const ind = indicadores ?? {}

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
      <PanelHeader municipio={municipio} indicadores={ind} cluster={cluster} />

      {/* Breadcrumb / crosslink */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link href="/brasil/mapa?indicador=imdf" style={{ color: 'var(--navy)', fontSize: '0.875rem' }}>
          → Ver no mapa nacional
        </Link>
        <Link href={`/brasil/ranking?indicador=imdf`} style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Ranking nacional
        </Link>
      </div>

      {/* Dimensions grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <DimensionCard
          title="D1 — Acesso Físico"
          description="Presença de pontos de atendimento financeiro no território"
          indicators={[
            { chave: 'dens_agencias', label: 'Agências por 10 mil hab.', value: ind.dens_agencias, format: 'decimal' },
            { chave: 'dens_pontos', label: 'Pontos totais por 10 mil hab.', value: ind.dens_pontos, format: 'decimal', verify: true },
            { chave: 'deserto_bancario', label: 'Deserto bancário', value: ind.deserto_bancario, format: 'integer' },
            { chave: 'hab_por_ponto', label: 'Hab. por ponto de acesso', value: ind.hab_por_ponto, format: 'compact' },
          ]}
        />
        <DimensionCard
          title="D2 — Profundidade e Uso"
          description="Volume de crédito e depósitos em relação à economia local"
          indicators={[
            { chave: 'credito_pc', label: 'Crédito per capita (R$)', value: ind.credito_pc, format: 'compact' },
            { chave: 'deposito_pc', label: 'Depósitos per capita (R$)', value: ind.deposito_pc, format: 'compact' },
            { chave: 'credito_pib', label: 'Crédito / PIB', value: ind.credito_pib, format: 'decimal', gauge: { value: ind.irpb ?? 0, reference: 1 } },
            { chave: 'profundidade_pib', label: 'Profundidade financeira / PIB', value: ind.profundidade_pib, format: 'decimal' },
          ]}
        />
        <DimensionCard
          title="D3 — Intermediação"
          description="Relação entre crédito concedido e depósitos captados"
          indicators={[
            { chave: 'rcd', label: 'Razão crédito/depósito', value: ind.rcd, format: 'decimal' },
            { chave: 'sli_pc', label: 'Saldo líq. intermediação per capita', value: ind.sli_pc, format: 'compact' },
            { chave: 'irf', label: 'Índice de retenção financeira', value: ind.irf, format: 'decimal' },
          ]}
        />
        <DimensionCard
          title="D4 — Digitalização"
          description="Adoção de pagamentos digitais via Pix"
          indicators={[
            { chave: 'pix_tx_pc', label: 'Transações Pix per capita', value: ind.pix_tx_pc, format: 'decimal', verify: true },
            { chave: 'pix_val_pib', label: 'Valor Pix / PIB', value: ind.pix_val_pib, format: 'decimal', verify: true },
          ]}
        />
        <DimensionCard
          title="D5 — Desigualdade Relativa"
          description="Posição do município em relação à média nacional"
          indicators={[
            { chave: 'irc', label: 'Índice relativo de crédito', value: ind.irc, format: 'decimal', gauge: { value: ind.irc ?? 0 } },
            { chave: 'ird', label: 'Índice relativo de depósitos', value: ind.ird, format: 'decimal', gauge: { value: ind.ird ?? 0 } },
            { chave: 'resid_imb_idhm', label: 'Resíduo bancariz./IFDM', value: ind.resid_imb_idhm, format: 'decimal' },
          ]}
        />
      </div>

      {/* Comparador */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '1rem' }}>
          Comparativo
        </h2>
        <Comparador
          municipioNome={municipio.nome}
          municipio={{ dens_pontos: ind.dens_pontos ?? 0, credito_pc: ind.credito_pc ?? 0, rcd: ind.rcd ?? 0, pix_tx_pc: ind.pix_tx_pc ?? 0, imdf: ind.imdf ?? 0 }}
          nacional={{ dens_pontos: referencia?.nacional?.dens_pontos ?? 0, credito_pc: referencia?.nacional?.credito_pc ?? 0, rcd: 0, pix_tx_pc: 0, imdf: referencia?.nacional?.imdf ?? 0 }}
          cluster={cluster?.perfil}
        />
      </section>

      {/* Serie temporal */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '1rem' }}>
          Evolução Temporal
        </h2>
        <Serie3Chart
          data={serie3}
          indicadores={[
            { chave: 'imdf', label: 'IMDF', color: '#1a2744' },
            { chave: 'credito_pib', label: 'Crédito/PIB', color: '#b8860b' },
            { chave: 'dens_pontos', label: 'Dens. Pontos', color: '#6b6460' },
          ]}
          title="Indicadores selecionados — 3 pontos temporais"
        />
      </section>

      {/* DataSheet */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '1rem' }}>
          Dados Brutos
        </h2>
        <DataSheet
          municipio_id={municipio.municipio_id}
          indicadores={ind}
          data_ref_estban={ind.data_ref_estban}
          data_ref_pix={ind.data_ref_pix}
        />
      </section>
    </div>
  )
}
