const ptBR = new Intl.NumberFormat('pt-BR')
const ptBRDecimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ptBRCompact = new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' })
const ptBRCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return ptBR.format(v)
}

export function formatDecimal(v: number | null | undefined, decimals = 2): string {
  if (v == null || !isFinite(v)) return '—'
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v)
}

export function formatCompact(v: number | null | undefined): string {
  if (v == null) return '—'
  return ptBRCompact.format(v)
}

export function formatCurrency(v: number | null | undefined): string {
  if (v == null) return '—'
  return ptBRCurrency.format(v)
}

export function formatPercent(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(v)
}

export function formatDate(yyyymm: string | null | undefined): string {
  if (!yyyymm) return '—'
  const year = yyyymm.slice(0, 4)
  const month = yyyymm.slice(4, 6)
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${months[parseInt(month) - 1]}/${year}`
}
