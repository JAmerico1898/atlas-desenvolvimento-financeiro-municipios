import { formatCompact, formatDecimal } from '@/lib/formatters'
import HelpTooltip from './HelpTooltip'

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
  rankImb?: number | null
  rankPop?: number | null
  rankPib?: number | null
}

export default function PanelHeader({ municipio, indicadores, rankImb, rankPop, rankPib }: PanelHeaderProps) {
  return (
    <div style={{ borderBottom: '1px solid var(--light-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Name + UF + Região */}
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
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <StatCard
          label="População"
          value={formatCompact(municipio.pop_total)}
          sub={
            <>
              <span>hab.</span>
              {rankPop != null && (
                <><br /><RankBadge rank={rankPop} label="nacional" /></>
              )}
            </>
          }
        />
        <StatCard
          label={municipio.ano_ref_pib ? `PIB (${municipio.ano_ref_pib})` : 'PIB'}
          value={`R$ ${formatCompact(municipio.pib)}`}
          sub={
            <>
              <span style={{ display: 'block', marginBottom: '0.2rem' }}>total municipal</span>
              {rankPib != null && <RankBadge rank={rankPib} label="nacional" />}
            </>
          }
        />
        <StatCard
          label="IMDF"
          helpText="Síntese das 5 dimensões via PCA (acesso, profundidade, intermediação, digitalização, desigualdade). Normalizado 0–1: maior = mais desenvolvido."
          value={formatDecimal(indicadores.imdf)}
          sub={
            <>
              <span style={{ display: 'block', marginBottom: '0.2rem' }}>Índice Municipal de Desenv. Financeiro</span>
              <RankBadge rank={indicadores.rank_imdf_nacional} label="nacional" />
              {' · '}
              <RankBadge rank={indicadores.rank_imdf_uf} label={`em ${municipio.uf}`} />
            </>
          }
          highlight
        />
        <StatCard
          label="IMB"
          helpText="Síntese de acesso físico e profundidade financeira via PCA. Mede a inclusão bancária formal. Normalizado 0–1: maior = mais bancarizado."
          value={formatDecimal(indicadores.imb)}
          sub={
            <>
              <span style={{ display: 'block', marginBottom: '0.2rem' }}>Índice Municipal de Bancarização</span>
              {rankImb != null && <RankBadge rank={rankImb} label="nacional" />}
            </>
          }
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
  helpText,
}: {
  label: string
  value: string
  sub: React.ReactNode
  highlight?: boolean
  helpText?: string
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
          display: 'flex',
          alignItems: 'center',
          gap: '0.2rem',
        }}
      >
        <span>{label}</span>
        {helpText && <HelpTooltip text={helpText} />}
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

function RankBadge({ rank, label }: { rank: number | null; label: string }) {
  if (rank == null) return null
  return (
    <span style={{ fontWeight: 600, color: 'var(--navy-light)' }}>
      #{rank.toLocaleString('pt-BR')} {label}
    </span>
  )
}
