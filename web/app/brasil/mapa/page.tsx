'use client'
import { useState, useEffect } from 'react'
import ChoroplethMap from '@/components/ChoroplethMap'

const INDICADORES = [
  { chave: 'imdf', label: 'IMDF — Desenvolvimento Financeiro' },
  { chave: 'imb', label: 'IMB — Bancarização' },
  { chave: 'credito_pib', label: 'Crédito / PIB' },
  { chave: 'dens_agencias', label: 'Densidade de Agências' },
  { chave: 'dens_pontos', label: 'Densidade de Pontos' },
  { chave: 'deposito_pc', label: 'Depósitos per capita' },
  { chave: 'pix_tx_pc', label: 'Transações Pix per capita' },
  { chave: 'deserto_bancario', label: 'Deserto Bancário' },
  { chave: 'irf', label: 'Índice de Retenção Financeira' },
]
const PONTOS = [
  { value: 't0', label: 'mar/2026' },
  { value: 't_12', label: 'mar/2025' },
  { value: 't_24', label: 'mar/2024' },
]

export default function MapaPage() {
  const [indicador, setIndicador] = useState('imdf')
  const [ponto, setPonto] = useState('t0')
  const [mapaData, setMapaData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/nacional/mapa?indicador=${indicador}&ponto=${ponto}`)
      .then(r => r.json())
      .then(d => { setMapaData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [indicador, ponto])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      {/* Controls bar */}
      <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--light-border)', display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'var(--cream)' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>INDICADOR</label>
          <select value={indicador} onChange={e => setIndicador(e.target.value)} style={{ border: '1px solid var(--light-border)', background: 'white', padding: '0.375rem 0.75rem', borderRadius: '4px', color: 'var(--navy)', fontSize: '0.875rem' }}>
            {INDICADORES.map(i => <option key={i.chave} value={i.chave}>{i.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PERÍODO</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {PONTOS.map(p => (
              <button key={p.value} onClick={() => setPonto(p.value)}
                style={{ padding: '0.375rem 0.75rem', borderRadius: '4px', border: '1px solid var(--light-border)', background: ponto === p.value ? 'var(--navy)' : 'white', color: ponto === p.value ? 'white' : 'var(--navy)', fontSize: '0.875rem', cursor: 'pointer' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {loading && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Carregando...</span>}
      </div>
      {/* Map */}
      <div style={{ flex: 1 }}>
        {mapaData && (
          <ChoroplethMap
            valores={mapaData.valores ?? []}
            dominio={mapaData.dominio ?? {}}
            indicador={indicador}
            height={undefined}
          />
        )}
      </div>
    </div>
  )
}
