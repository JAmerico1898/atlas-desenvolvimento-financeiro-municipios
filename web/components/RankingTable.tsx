'use client'
import Link from 'next/link'

interface RankingItem {
  posicao: number
  municipio_id: string
  nome: string
  uf: string
  valor: number | null
}

interface RankingTableProps {
  items: RankingItem[]
  total: number
  page: number
  pageSize?: number
  onPageChange: (page: number) => void
  indicador: string
}

export default function RankingTable({
  items,
  total,
  page,
  pageSize = 50,
  onPageChange,
  indicador,
}: RankingTableProps) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--light-border)' }}>
              {['#', 'Município', 'UF', indicador].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '0.5rem 0.75rem',
                    textAlign: i === 3 ? 'right' : 'left',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={item.municipio_id}
                style={{
                  borderBottom: '1px solid var(--light-border)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(26,39,68,0.02)',
                }}
              >
                <td
                  style={{
                    padding: '0.45rem 0.75rem',
                    color: 'var(--text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.8rem',
                    width: '3rem',
                  }}
                >
                  {item.posicao}
                </td>
                <td style={{ padding: '0.45rem 0.75rem' }}>
                  <Link
                    href={`/municipio/${item.municipio_id}`}
                    style={{
                      color: 'var(--navy)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {item.nome}
                  </Link>
                </td>
                <td style={{ padding: '0.45rem 0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'white',
                      background: 'var(--navy-light)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontWeight: 600,
                    }}
                  >
                    {item.uf}
                  </span>
                </td>
                <td
                  style={{
                    padding: '0.45rem 0.75rem',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--navy)',
                    fontWeight: 500,
                  }}
                >
                  {item.valor != null
                    ? item.valor.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
            fontSize: '0.875rem',
          }}
        >
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--light-border)',
              borderRadius: '4px',
              background: 'white',
              color: page <= 1 ? 'var(--text-muted)' : 'var(--navy)',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ‹
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p: number
            if (totalPages <= 7) {
              p = i + 1
            } else if (page <= 4) {
              p = i + 1
            } else if (page >= totalPages - 3) {
              p = totalPages - 6 + i
            } else {
              p = page - 3 + i
            }
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                style={{
                  padding: '4px 10px',
                  border: '1px solid var(--light-border)',
                  borderRadius: '4px',
                  background: p === page ? 'var(--navy)' : 'white',
                  color: p === page ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: p === page ? 600 : 400,
                }}
              >
                {p}
              </button>
            )
          })}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={{
              padding: '4px 10px',
              border: '1px solid var(--light-border)',
              borderRadius: '4px',
              background: 'white',
              color: page >= totalPages ? 'var(--text-muted)' : 'var(--navy)',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            ›
          </button>

          <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {total.toLocaleString('pt-BR')} municípios
          </span>
        </div>
      )}
    </div>
  )
}
