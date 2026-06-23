'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface ImdfPanelProps {
  distribuicao: number[]
  cargas: { variavel: string; carga: number }[]
  variancia_exp: number
}

const VAR_LABEL: Record<string, string> = {
  dens_pontos: 'Dens. pontos',
  credito_pc: 'Crédito pc',
  rcd: 'RCD',
  pix_tx_pc: 'Pix tx pc',
  deposito_pc: 'Depósito pc',
  dens_ag: 'Agências',
  dens_correspondente: 'Correspondentes',
  imb: 'IMB',
}

export default function ImdfPanel({ distribuicao, cargas, variancia_exp }: ImdfPanelProps) {
  // Build histogram bins from distribuicao values
  const bins = 20
  const min = Math.min(...distribuicao)
  const max = Math.max(...distribuicao)
  const step = (max - min) / bins

  const histData = Array.from({ length: bins }, (_, i) => {
    const lo = min + i * step
    const hi = lo + step
    const count = distribuicao.filter(v => (i < bins - 1 ? v >= lo && v < hi : v >= lo && v <= hi)).length
    const label = lo.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return { label, count, lo }
  })

  // Sort cargas by abs value descending
  const sortedCargas = [...cargas].sort((a, b) => Math.abs(b.carga) - Math.abs(a.carga))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Histogram */}
      <div>
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            color: 'var(--navy)',
            fontSize: '1rem',
            margin: '0 0 0.25rem',
          }}
        >
          Distribuição do IMDF
        </h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
          {distribuicao.length.toLocaleString('pt-BR')} municípios
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }} barGap={0}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              interval={3}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid var(--light-border)',
                borderRadius: '4px',
                fontSize: '0.8rem',
              }}
              formatter={(v: number) => [`${v} municípios`, 'Frequência']}
              labelFormatter={l => `IMDF ≥ ${l}`}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {histData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.lo >= 0
                      ? `rgba(26,39,68,${0.4 + (entry.lo / max) * 0.6})`
                      : 'rgba(107,100,96,0.4)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PCA loadings */}
      <div>
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            color: 'var(--navy)',
            fontSize: '1rem',
            margin: '0 0 0.25rem',
          }}
        >
          Cargas PCA (PC1)
        </h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
          Variância explicada:{' '}
          {(variancia_exp * 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          %
        </p>
        <ResponsiveContainer width="100%" height={sortedCargas.length * 32 + 20}>
          <BarChart
            data={sortedCargas.map(c => ({
              variavel: VAR_LABEL[c.variavel] ?? c.variavel,
              carga: c.carga,
            }))}
            layout="vertical"
            margin={{ top: 4, right: 48, bottom: 4, left: 100 }}
          >
            <XAxis
              type="number"
              domain={[-1, 1]}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="variavel"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
              width={95}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid var(--light-border)',
                borderRadius: '4px',
                fontSize: '0.8rem',
              }}
              formatter={(v: number) => [
                v.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
                'Carga',
              ]}
            />
            <Bar dataKey="carga" radius={[0, 2, 2, 0]}>
              {sortedCargas.map((c, i) => (
                <Cell key={i} fill={c.carga >= 0 ? 'var(--navy)' : 'var(--warm-gray)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
