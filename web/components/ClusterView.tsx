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
  dens_agencias: 'Densidade de agências',
  dens_pontos: 'Densidade de pontos',
  hab_por_ponto: 'Hab. por ponto de acesso',
  credito_pc: 'Crédito per capita',
  deposito_pc: 'Depósito per capita',
  profundidade_pib: 'Profundidade financeira/PIB',
  credito_pib: 'Crédito/PIB',
  rcd: 'Razão crédito/depósito',
  sli_pc: 'Saldo líq. intermediação per capita',
  irf: 'Índice de Retenção Financeira',
  pix_tx_pc: 'Pix per capita',
  valor_pix_pc: 'Valor Pix per capita',
  imdf: 'IMDF',
  imb: 'IMB',
}

// The 7 features used in k-means clustering
const CLUSTERING_FEATURES = [
  'dens_pontos', 'credito_pc', 'deposito_pc', 'rcd', 'pix_tx_pc', 'imb', 'imdf',
]

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
  const sorted = [...clusters].sort((a, b) => (b.perfil?.imdf ?? -Infinity) - (a.perfil?.imdf ?? -Infinity))

  return (
    <div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        Agrupamento por k-means (k=5) sobre 7 indicadores financeiros padronizados: densidade de pontos, crédito per capita,
        depósito per capita, razão crédito/depósito, Pix per capita, IMB e IMDF.
        As barras mostram o z-score médio de cada grupo nos 7 indicadores de agrupamento em relação à média nacional — valores positivos indicam desempenho acima da média.
        Grupos ordenados de maior para menor inclusão financeira (IMDF médio decrescente).
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1rem',
        }}
      >
      {sorted.map((cluster, idx) => {
        const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length]
        const clusterIndicators = CLUSTERING_FEATURES
          .map(key => [key, cluster.perfil[key] ?? 0] as [string, number])
          .filter(([key]) => key in cluster.perfil)

        const maxVal = Math.max(...clusterIndicators.map(([, v]) => Math.abs(v)), 1)

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
              {clusterIndicators.map(([key, val]) => {
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
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: val >= 0 ? 'var(--navy)' : 'var(--text-muted)' }}>
                        {val >= 0 ? '+' : ''}{val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    </div>
  )
}
