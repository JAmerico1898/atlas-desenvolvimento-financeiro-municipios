'use client'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

interface ComparadorProps {
  municipio: Record<string, number>
  nacional: Record<string, number>
  cluster?: Record<string, number>
  municipioNome: string
}

const DIMENSIONS = [
  { key: 'dens_pontos', label: 'D1 Acesso' },
  { key: 'credito_pc', label: 'D2 Crédito' },
  { key: 'rcd', label: 'D3 Interm.' },
  { key: 'pix_tx_pc', label: 'D4 Digital' },
  { key: 'imdf', label: 'Síntese' },
]

function normalize(
  values: Record<string, number>[],
  key: string
): number[] {
  const nums = values.map(v => v[key] ?? 0)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  if (max === min) return nums.map(() => 0.5)
  return nums.map(v => (v - min) / (max - min))
}

export default function Comparador({ municipio, nacional, cluster, municipioNome }: ComparadorProps) {
  const sources = cluster
    ? [municipio, nacional, cluster]
    : [municipio, nacional]

  const chartData = DIMENSIONS.map(dim => {
    const norms = normalize(sources, dim.key)
    const row: Record<string, string | number> = { subject: dim.label }
    row.municipio = norms[0]
    row.nacional = norms[1]
    if (cluster) row.cluster = norms[2]
    return row
  })

  return (
    <div>
      <h4
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          color: 'var(--navy)',
          fontSize: '1rem',
          margin: '0 0 0.5rem',
        }}
      >
        Perfil comparativo
      </h4>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
        Valores normalizados (0–1) por dimensão para comparação visual.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
          <PolarGrid stroke="var(--light-border)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickCount={3}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid var(--light-border)',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
            formatter={(v: number) =>
              v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
          />
          <Radar
            name={municipioNome}
            dataKey="municipio"
            stroke="var(--navy)"
            fill="var(--navy)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            name="Média nacional"
            dataKey="nacional"
            stroke="var(--gold)"
            fill="var(--gold)"
            fillOpacity={0.10}
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          {cluster && (
            <Radar
              name="Cluster"
              dataKey="cluster"
              stroke="var(--warm-gray)"
              fill="var(--warm-gray)"
              fillOpacity={0.08}
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />
          )}
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
