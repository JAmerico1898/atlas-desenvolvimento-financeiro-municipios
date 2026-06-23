import { formatDecimal, formatCompact, formatPercent, formatNumber } from '@/lib/formatters'
import RelativeGauge from './RelativeGauge'
import VerifyNotice from './VerifyNotice'

interface Indicator {
  chave: string
  label: string
  value: number | null
  format?: 'decimal' | 'percent' | 'compact' | 'integer'
  verify?: boolean
  gauge?: { value: number; reference?: number }
}

interface DimensionCardProps {
  title: string
  description: string
  indicators: Indicator[]
}

function formatValue(value: number | null, format?: string): string {
  if (value == null) return '—'
  switch (format) {
    case 'percent':
      return formatPercent(value)
    case 'compact':
      return formatCompact(value)
    case 'integer':
      return formatNumber(value)
    default:
      return formatDecimal(value)
  }
}

export default function DimensionCard({ title, description, indicators }: DimensionCardProps) {
  return (
    <div
      style={{
        border: '1px solid var(--light-border)',
        borderRadius: '8px',
        padding: '1.25rem 1.5rem',
        background: 'white',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          color: 'var(--navy)',
          fontSize: '1.2rem',
          margin: '0 0 0.25rem',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
        {description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {indicators.map(ind => (
          <div
            key={ind.chave}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '0.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--light-border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {ind.label}
              </span>
              {ind.verify && (
                <span style={{ marginLeft: '0.4rem' }}>
                  <VerifyNotice />
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexShrink: 0 }}>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--navy)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatValue(ind.value, ind.format)}
              </span>
              {ind.gauge && ind.value != null && (
                <RelativeGauge value={ind.gauge.value} reference={ind.gauge.reference} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
