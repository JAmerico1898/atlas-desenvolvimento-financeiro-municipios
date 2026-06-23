interface RelativeGaugeProps {
  value: number
  reference?: number
  label?: string
}

export default function RelativeGauge({ value, reference = 1, label }: RelativeGaugeProps) {
  if (value == null || reference == null) return null

  const diff = value - reference
  const pct = reference !== 0 ? (diff / reference) * 100 : 0
  const above = diff >= 0

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem',
        fontSize: '0.78rem',
        color: above ? 'var(--gold)' : 'var(--text-muted)',
        fontWeight: 500,
      }}
      title={label ?? `Referência: ${reference.toFixed(2)}`}
    >
      <span style={{ fontSize: '0.85rem' }}>{above ? '▲' : '▼'}</span>
      <span>
        {Math.abs(pct).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
        {label ? ` ${label}` : above ? ' acima da média' : ' abaixo da média'}
      </span>
    </span>
  )
}
