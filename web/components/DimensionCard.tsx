'use client'

import Link from 'next/link'
import { formatDecimal, formatCompact, formatPercent, formatNumber } from '@/lib/formatters'
import RelativeGauge from './RelativeGauge'
import HelpTooltip from './HelpTooltip'

interface Indicator {
  chave: string
  label: string
  value: number | null
  format?: 'decimal' | 'percent' | 'compact' | 'integer' | 'currency-compact'
  help?: string
  gauge?: { value: number; reference?: number }
  rank?: number | null
  noMap?: boolean
}

interface DimensionCardProps {
  title: string
  description: string
  indicators: Indicator[]
  municipioId?: string
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
    case 'currency-compact':
      return `R$ ${formatCompact(value)}`
    default:
      return formatDecimal(value)
  }
}

export default function DimensionCard({ title, description, indicators, municipioId }: DimensionCardProps) {
  return (
    <div
      style={{
        border: '1px solid var(--light-border)',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        background: 'white',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 400,
          color: 'var(--navy)',
          fontSize: '1.3rem',
          margin: '0 0 0.2rem',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
        {description}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {indicators.map((ind) => (
          <div
            key={ind.chave}
            style={{ paddingBottom: '0.4rem', borderBottom: '1px solid var(--light-border)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {municipioId && !ind.noMap ? (
                  <Link
                    href={`/brasil/mapa?indicador=${ind.chave}&destaque=${municipioId}`}
                    style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: 'var(--navy)', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}
                  >
                    {ind.label}
                  </Link>
                ) : (
                  <span style={{ fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: 'var(--navy)' }}>{ind.label}</span>
                )}
                {ind.help && <HelpTooltip text={ind.help} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
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
            {ind.rank != null && (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textAlign: 'right',
                  marginTop: '0.15rem',
                }}
              >
                #{ind.rank.toLocaleString('pt-BR')} no ranking nacional
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
