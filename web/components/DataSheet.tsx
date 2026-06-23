'use client'
import { formatDecimal } from '@/lib/formatters'

interface DataSheetProps {
  municipio_id: string
  indicadores: Record<string, number | null>
  data_ref_estban?: string
  data_ref_pix?: string
}

const LABEL_MAP: Record<string, string> = {
  dens_pontos: 'Densidade de pontos de atendimento (por 10k hab.)',
  dens_ag: 'Densidade de agências (por 10k hab.)',
  dens_pa: 'Densidade de postos de atendimento (por 10k hab.)',
  dens_correspondente: 'Densidade de correspondentes (por 10k hab.)',
  deserto_bancario: 'Deserto bancário (1 = sim)',
  credito_pc: 'Crédito per capita (R$)',
  deposito_pc: 'Depósito per capita (R$)',
  rcd: 'Razão crédito/depósito (RCD)',
  irpb: 'Índice de reinvestimento de poupança bancária (IRPB)',
  pix_tx_pc: 'Transações Pix per capita',
  pix_vol_pc: 'Volume Pix per capita (R$)',
  imdf: 'IMDF — Índice de Maturidade do Desenvolvimento Financeiro',
  imb: 'IMB — Índice de Maturidade Bancária',
  rank_imdf_nacional: 'Ranking IMDF nacional (posição)',
  rank_imdf_uf: 'Ranking IMDF na UF (posição)',
  cluster_id: 'Cluster ID',
  gini_credito: 'Gini crédito (desigualdade municipal)',
  theil_credito: 'Theil crédito (desigualdade municipal)',
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function DataSheet({
  municipio_id,
  indicadores,
  data_ref_estban,
  data_ref_pix,
}: DataSheetProps) {
  const entries = Object.entries(indicadores)

  function handleCSV() {
    const header = 'chave,label,valor'
    const rows = entries.map(([k, v]) => {
      const label = LABEL_MAP[k] ?? k
      return `${k},"${label}",${v ?? ''}`
    })
    const csv = [header, ...rows].join('\n')
    downloadFile(csv, `adfm-${municipio_id}.csv`, 'text/csv')
  }

  function handleJSON() {
    const payload = {
      municipio_id,
      data_ref_estban,
      data_ref_pix,
      indicadores,
    }
    downloadFile(JSON.stringify(payload, null, 2), `adfm-${municipio_id}.json`, 'application/json')
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            color: 'var(--navy)',
            fontSize: '1rem',
            margin: 0,
          }}
        >
          Dados brutos
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleCSV}
            style={{
              fontSize: '0.8rem',
              padding: '4px 10px',
              border: '1px solid var(--light-border)',
              borderRadius: '4px',
              background: 'white',
              color: 'var(--navy)',
              cursor: 'pointer',
            }}
          >
            ↓ CSV
          </button>
          <button
            onClick={handleJSON}
            style={{
              fontSize: '0.8rem',
              padding: '4px 10px',
              border: '1px solid var(--light-border)',
              borderRadius: '4px',
              background: 'white',
              color: 'var(--navy)',
              cursor: 'pointer',
            }}
          >
            ↓ JSON
          </button>
        </div>
      </div>

      {(data_ref_estban || data_ref_pix) && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
          {data_ref_estban && <>Estban: {data_ref_estban}</>}
          {data_ref_estban && data_ref_pix && ' · '}
          {data_ref_pix && <>Pix: {data_ref_pix}</>}
        </p>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.825rem',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--light-border)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '0.4rem 0.5rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Indicador
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '0.4rem 0.5rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([chave, valor], i) => (
              <tr
                key={chave}
                style={{
                  borderBottom: '1px solid var(--light-border)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(26,39,68,0.02)',
                }}
              >
                <td style={{ padding: '0.35rem 0.5rem', color: 'var(--text-secondary)' }}>
                  {LABEL_MAP[chave] ?? chave}
                </td>
                <td
                  style={{
                    padding: '0.35rem 0.5rem',
                    textAlign: 'right',
                    color: 'var(--navy)',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 500,
                  }}
                >
                  {valor != null ? formatDecimal(valor) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
