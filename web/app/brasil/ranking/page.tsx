'use client'
import { useState, useEffect } from 'react'
import RankingTable from '@/components/RankingTable'
import Link from 'next/link'

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const REGIOES = ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul']
const INDICADORES = [
  { chave: 'imdf', label: 'IMDF' },
  { chave: 'imb', label: 'IMB' },
  { chave: 'credito_pib', label: 'Crédito/PIB' },
  { chave: 'dens_agencias', label: 'Dens. Agências' },
  { chave: 'deposito_pc', label: 'Depósito per capita' },
  { chave: 'pix_tx_pc', label: 'Pix per capita' },
]

export default function RankingPage() {
  const [indicador, setIndicador] = useState('imdf')
  const [uf, setUf] = useState('')
  const [regiao, setRegiao] = useState('')
  const [ordem, setOrdem] = useState<'desc'|'asc'>('desc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const params = new URLSearchParams({ indicador, ordem, page: String(page) })
    if (uf) params.set('uf', uf)
    if (regiao) params.set('regiao', regiao)
    fetch(`/api/nacional/ranking?${params}`)
      .then(r => r.json())
      .then(setData)
  }, [indicador, uf, regiao, ordem, page])

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '1.5rem' }}>
        Ranking Nacional
      </h1>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem', background: 'white', border: '1px solid var(--light-border)', borderRadius: '4px' }}>
        <select value={indicador} onChange={e => { setIndicador(e.target.value); setPage(1) }} style={{ border: '1px solid var(--light-border)', padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
          {INDICADORES.map(i => <option key={i.chave} value={i.chave}>{i.label}</option>)}
        </select>
        <select value={uf} onChange={e => { setUf(e.target.value); setPage(1) }} style={{ border: '1px solid var(--light-border)', padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
          <option value="">Todos os estados</option>
          {UFS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={regiao} onChange={e => { setRegiao(e.target.value); setPage(1) }} style={{ border: '1px solid var(--light-border)', padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
          <option value="">Todas as regiões</option>
          {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={() => setOrdem(o => o === 'desc' ? 'asc' : 'desc')} style={{ border: '1px solid var(--light-border)', padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer', background: 'white' }}>
          {ordem === 'desc' ? '↓ Maior primeiro' : '↑ Menor primeiro'}
        </button>
      </div>
      {data && (
        <RankingTable
          items={data.items ?? []}
          total={data.total ?? 0}
          page={page}
          onPageChange={setPage}
          indicador={indicador}
        />
      )}
    </div>
  )
}
