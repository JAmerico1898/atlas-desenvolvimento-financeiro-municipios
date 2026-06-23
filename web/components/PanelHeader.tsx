import { formatCompact, formatDecimal } from '@/lib/formatters'

interface PanelHeaderProps {
  municipio: {
    nome: string
    uf: string
    regiao: string
    pop_total: number
    pib: number
    ano_ref_pib: number
  }
  indicadores: {
    imdf: number
    rank_imdf_nacional: number
    rank_imdf_uf: number
    imb: number
    cluster_id: number
  }
  cluster: { rotulo: string } | null
}

export default function PanelHeader({ municipio, indicadores, cluster }: PanelHeaderProps) {
  return (
    <div style={{ borderBottom: '1px solid var(--light-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Name + badges */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: '2.2rem',
            color: 'var(--navy)',
            margin: 0,
          }}
        >
          {municipio.nome}
        </h1>
        <Badge label={municipio.uf} color="var(--navy-light)" />
        <Badge label={municipio.regiao} color="var(--warm-gray)" />
        {cluster && <Badge label={cluster.rotulo} color="var(--gold)" />}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <StatCard
          label="População"
          value={formatCompact(municipio.pop_total)}
          sub="hab."
        />
        <StatCard
          label={`PIB (${municipio.ano_ref_pib})`}
          value={`R$ ${formatCompact(municipio.pib)}`}
          sub="per capita aprox."
        />
        <StatCard
          label="IMDF"
          value={formatDecimal(indicadores.imdf)}
          sub={
            <>
              <RankBadge rank={indicadores.rank_imdf_nacional} label="nacional" />
              {' · '}
              <RankBadge rank={indicadores.rank_imdf_uf} label={`em ${municipio.uf}`} />
            </>
          }
          highlight
        />
        <StatCard
          label="IMB"
          value={formatDecimal(indicadores.imb)}
          sub="índice de maturidade bancária"
        />
      </div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: '0.75rem',
        color: 'white',
        background: color,
        padding: '2px 8px',
        borderRadius: '3px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      style={{
        background: highlight ? 'rgba(184,134,11,0.08)' : 'rgba(26,39,68,0.04)',
        border: highlight ? '1px solid rgba(184,134,11,0.3)' : '1px solid var(--light-border)',
        borderRadius: '6px',
        padding: '0.65rem 1rem',
        minWidth: '140px',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.2rem',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.4rem',
          fontFamily: 'var(--font-heading)',
          color: highlight ? 'var(--gold)' : 'var(--navy)',
          fontWeight: 300,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
        {sub}
      </div>
    </div>
  )
}

function RankBadge({ rank, label }: { rank: number; label: string }) {
  return (
    <span style={{ fontWeight: 600, color: 'var(--navy-light)' }}>
      #{rank.toLocaleString('pt-BR')} {label}
    </span>
  )
}
