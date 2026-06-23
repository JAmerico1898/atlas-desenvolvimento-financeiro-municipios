interface Cluster {
  cluster_id: number
  rotulo: string
  n_municipios: number
  perfil: Record<string, number>
}

interface ClusterViewProps {
  clusters: Cluster[]
}

const PERFIL_LABEL: Record<string, string> = {
  dens_pontos: 'Densidade de pontos',
  credito_pc: 'Crédito per capita',
  rcd: 'Razão crédito/depósito',
  pix_tx_pc: 'Pix per capita',
  imdf: 'IMDF',
  imb: 'IMB',
  deposito_pc: 'Depósito per capita',
}

const CLUSTER_COLORS = [
  '#1a2744',
  '#2a3f6a',
  '#6090b2',
  '#b8860b',
  '#d4a843',
  '#6b6460',
  '#a8c4d8',
]

export default function ClusterView({ clusters }: ClusterViewProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}
    >
      {clusters.map((cluster, idx) => {
        const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length]
        const topIndicators = Object.entries(cluster.perfil)
          .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
          .slice(0, 3)

        const maxVal = Math.max(...topIndicators.map(([, v]) => Math.abs(v)), 1)

        return (
          <div
            key={cluster.cluster_id}
            style={{
              border: '1px solid var(--light-border)',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'white',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: color,
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 300,
                  color: 'white',
                  fontSize: '1.05rem',
                  margin: 0,
                }}
              >
                {cluster.rotulo}
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.75)',
                  flexShrink: 0,
                  marginLeft: '0.5rem',
                }}
              >
                {cluster.n_municipios.toLocaleString('pt-BR')} municípios
              </span>
            </div>

            {/* Profile bars */}
            <div style={{ padding: '0.75rem 1rem' }}>
              {topIndicators.map(([key, val]) => {
                const barWidth = Math.abs(val) / maxVal
                const barColor = val >= 0 ? color : 'var(--warm-gray)'
                return (
                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '3px',
                      }}
                    >
                      <span>{PERFIL_LABEL[key] ?? key}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--navy)' }}>
                        {val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: 'var(--light-border)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidth * 100}%`,
                          height: '100%',
                          background: barColor,
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
