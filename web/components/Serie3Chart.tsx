'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts'
import { formatDate, formatDecimal } from '@/lib/formatters'

interface Serie3ChartProps {
  data: {
    [indicador: string]: { ponto: string; data_ref: string; valor: number }[]
  }
  indicadores: { chave: string; label: string; color: string }[]
  title?: string
}

export default function Serie3Chart({ data, indicadores, title }: Serie3ChartProps) {
  // Build unified array: [{ name: 't_24', label: 'mar/2024', ind1: val, ind2: val }, ...]
  const pontos = ['t_24', 't_12', 't0']

  const chartData = pontos.map(ponto => {
    const row: Record<string, string | number> = { ponto }

    for (const ind of indicadores) {
      const serie = data[ind.chave]
      if (!serie) continue
      const point = serie.find(p => p.ponto === ponto)
      if (point) {
        row[ind.chave] = point.valor
        if (!row.label) row.label = formatDate(point.data_ref)
      }
    }

    return row
  })

  return (
    <div>
      {title && (
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            color: 'var(--navy)',
            fontSize: '1rem',
            margin: '0 0 0.75rem',
          }}
        >
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--light-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--light-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={v => formatDecimal(v, 2)}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid var(--light-border)',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
            formatter={(v: number, name: string) => {
              const ind = indicadores.find(i => i.chave === name)
              return [formatDecimal(v), ind?.label ?? name]
            }}
          />
          {indicadores.length > 1 && (
            <Legend
              iconType="line"
              wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              formatter={(value: string) => {
                const ind = indicadores.find(i => i.chave === value)
                return ind?.label ?? value
              }}
            />
          )}
          {indicadores.map(ind => (
            <Line
              key={ind.chave}
              type="monotone"
              dataKey={ind.chave}
              stroke={ind.color}
              strokeWidth={2}
              dot={{ r: 4, fill: ind.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
