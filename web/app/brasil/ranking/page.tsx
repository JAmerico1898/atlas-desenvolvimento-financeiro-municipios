'use client'
import { useState, useEffect } from 'react'
import RankingTable from '@/components/RankingTable'
import Link from 'next/link'

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const REGIOES = ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul']
const INDICADORES = [
  // Índices síntese
  { chave: 'imdf',           label: 'IMDF',                      descricao: 'Índice Municipal de Desenvolvimento Financeiro — síntese de acesso, profundidade, intermediação, digitalização e desenvolvimento socioeconômico (0 = menor, 1 = maior).' },
  { chave: 'imb',            label: 'IMB',                       descricao: 'Índice Municipal de Bancarização — cobertura territorial e volume de depósitos per capita.' },
  // Acesso
  { chave: 'dens_agencias',  label: 'Dens. agências',            descricao: 'Número de agências bancárias por 10 mil habitantes.' },
  { chave: 'dens_pontos',    label: 'Dens. pontos de acesso',    descricao: 'Número de pontos de acesso financeiro (agências + postos + PAEs) por 10 mil habitantes.' },
  { chave: 'hab_por_ponto',  label: 'Hab. por ponto',            descricao: 'Número de habitantes por ponto de acesso financeiro — quanto menor, melhor a cobertura.' },
  { chave: 'deserto_bancario', label: 'Deserto bancário',        descricao: 'Indica se o município não possui nenhum ponto de acesso financeiro.' },
  // Profundidade
  { chave: 'credito_pc',     label: 'Crédito per capita',        descricao: 'Saldo total de operações de crédito por habitante (R$).' },
  { chave: 'deposito_pc',    label: 'Depósito per capita',       descricao: 'Volume total de depósitos (vista + poupança + prazo) por habitante (R$).' },
  { chave: 'credito_pib',    label: 'Crédito/PIB',               descricao: 'Saldo de crédito como proporção do PIB municipal.' },
  { chave: 'profundidade_pib', label: 'Profundidade financeira/PIB', descricao: 'Soma de crédito e depósitos como proporção do PIB — mede a profundidade total do sistema financeiro local.' },
  // Intermediação
  { chave: 'rcd',            label: 'Razão crédito/depósito',    descricao: 'Razão entre o saldo de crédito e o volume de depósitos — indica se o município é tomador ou poupador líquido.' },
  { chave: 'sli_pc',         label: 'Saldo líq. intermediação',  descricao: 'Diferença entre crédito e depósitos por habitante — positivo: município usa mais crédito do que poupa.' },
  { chave: 'irf',            label: 'Índice de Retenção Financeira', descricao: 'Proporção dos depósitos locais que retornam como crédito ao município.' },
  { chave: 'irc',            label: 'Índice Relativo de Crédito', descricao: 'Crédito per capita do município em relação à média nacional.' },
  { chave: 'ird',            label: 'Índice Relativo de Depósitos', descricao: 'Depósitos per capita do município em relação à média nacional.' },
  // Digitalização
  { chave: 'pix_tx_pc',      label: 'Pix per capita (qtd)',      descricao: 'Quantidade de transações Pix por habitante no período de referência.' },
  { chave: 'pix_val_pib',    label: 'Valor Pix/PIB',             descricao: 'Valor total das transações Pix como proporção do PIB municipal.' },
]

export default function RankingPage() {
  const [indicador, setIndicador] = useState('imdf')
  const [uf, setUf] = useState('')
  const [regiao, setRegiao] = useState('')
  const [ordem, setOrdem] = useState<'desc'|'asc'>('desc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setFetchError(null)
    const params = new URLSearchParams({ indicador, ordem, page: String(page) })
    if (uf) params.set('uf', uf)
    if (regiao) params.set('regiao', regiao)
    fetch(`/api/nacional/ranking?${params}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setFetchError(String(e)); setLoading(false) })
  }, [indicador, uf, regiao, ordem, page])

  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '1.5rem' }}>
        Ranking Nacional
      </h1>
      {/* Description */}
      {(() => {
        const ind = INDICADORES.find(i => i.chave === indicador)
        return ind ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
            {ind.descricao}
          </p>
        ) : null
      })()}
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
      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>Carregando...</p>}
      {fetchError && <p style={{ color: '#c0392b', fontSize: '0.875rem', marginTop: '1rem' }}>Erro ao carregar: {fetchError}</p>}
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
