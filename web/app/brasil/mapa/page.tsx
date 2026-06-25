'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChoroplethMap from '@/components/ChoroplethMap'

interface MunicipioResult {
  municipio_id: string
  nome: string
  uf: string
}

const INDICADORES = [
  { chave: 'imdf', label: 'IMDF — Desenvolvimento Financeiro' },
  { chave: 'imb', label: 'IMB — Bancarização' },
  { chave: 'credito_pib', label: 'Crédito / PIB' },
  { chave: 'dens_agencias', label: 'Densidade de Agências' },
  { chave: 'dens_pontos', label: 'Densidade de Pontos' },
  { chave: 'credito_pc', label: 'Crédito per capita' },
  { chave: 'deposito_pc', label: 'Depósitos per capita' },
  { chave: 'pix_tx_pc', label: 'Transações Pix per capita' },
  { chave: 'pix_val_pib', label: 'Valor Pix / PIB' },
  { chave: 'deserto_bancario', label: 'Deserto Bancário' },
  { chave: 'hab_por_ponto', label: 'Hab. por ponto de acesso' },
  { chave: 'irf', label: 'Índice de Retenção Financeira' },
  { chave: 'rcd', label: 'Razão Crédito/Depósito' },
  { chave: 'irc', label: 'Índice relativo de crédito' },
  { chave: 'ird', label: 'Índice relativo de depósitos' },
  { chave: 'profundidade_pib', label: 'Profundidade financeira / PIB' },
  { chave: 'sli_pc', label: 'Saldo líq. intermediação per capita' },
]

function MapaContent() {
  const searchParams = useSearchParams()
  const paramInd = searchParams.get('indicador')
  const initialIndicador = INDICADORES.some(i => i.chave === paramInd) ? paramInd! : 'imdf'
  const urlDestaque = searchParams.get('destaque') ?? undefined

  const [indicador, setIndicador] = useState(initialIndicador)
  const [destaque, setDestaque] = useState<string | undefined>(urlDestaque)
  const [destaqueLabel, setDestaqueLabel] = useState<string | undefined>(undefined)

  // On mount: if no URL destaque, restore the last visited município from localStorage
  useEffect(() => {
    if (urlDestaque) return
    try {
      const raw = localStorage.getItem('last_municipio')
      if (!raw) return
      const saved = JSON.parse(raw) as { codigo: string; nome: string; uf: string }
      if (saved.codigo) {
        setDestaque(saved.codigo)
        setDestaqueLabel(`${saved.nome}${saved.uf ? ` — ${saved.uf}` : ''}`)
      }
    } catch { /* ignore malformed */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [mapaData, setMapaData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MunicipioResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLoading(true)
    setFetchError(null)
    fetch(`/api/nacional/mapa?indicador=${indicador}&ponto=t0`)
      .then(r => r.json())
      .then(d => {
        if (d?.error) { setFetchError(d.error.message ?? 'Erro desconhecido'); setLoading(false); return }
        setMapaData(d)
        setLoading(false)
      })
      .catch(e => { setFetchError(String(e)); setLoading(false) })
  }, [indicador])

  // Municipality search with debounce
  useEffect(() => {
    if (query.length < 2) { setResults([]); setSearchOpen(false); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/municipios/search?q=${encodeURIComponent(query)}`)
        if (res.ok) { setResults(await res.json()); setSearchOpen(true); setActiveIndex(-1) }
      } catch { /* ignore */ }
      finally { setSearchLoading(false) }
    }, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  function selectMunicipio(m: MunicipioResult) {
    setDestaque(m.municipio_id)
    setDestaqueLabel(`${m.nome} — ${m.uf}`)
    setQuery('')
    setResults([])
    setSearchOpen(false)
  }

  function clearDestaque() {
    setDestaque(undefined)
    setDestaqueLabel(undefined)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!searchOpen) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); selectMunicipio(results[activeIndex]) }
    else if (e.key === 'Escape') setSearchOpen(false)
  }

  const activeLabel = destaqueLabel ?? (urlDestaque && destaque === urlDestaque ? 'município destacado' : undefined)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      {/* Controls bar */}
      <div style={{ padding: '0.75rem 2rem', borderBottom: '1px solid var(--light-border)', display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'var(--cream)', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>INDICADOR</label>
          <select value={indicador} onChange={e => setIndicador(e.target.value)} style={{ border: '1px solid var(--light-border)', background: 'white', padding: '0.375rem 0.75rem', borderRadius: '4px', color: 'var(--navy)', fontSize: '0.875rem' }}>
            {INDICADORES.map(i => <option key={i.chave} value={i.chave}>{i.label}</option>)}
          </select>
        </div>

        {/* Municipality search */}
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>MUNICÍPIO</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder={activeLabel ?? 'Localizar no mapa…'}
              style={{
                border: '1px solid var(--light-border)',
                background: 'white',
                padding: '0.375rem 0.75rem',
                borderRadius: '4px',
                color: 'var(--navy)',
                fontSize: '0.875rem',
                width: '220px',
                outline: 'none',
              }}
            />
            {searchLoading && (
              <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>…</span>
            )}
          </div>
          {searchOpen && results.length > 0 && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 1000,
              background: 'white',
              border: '1px solid var(--light-border)',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              listStyle: 'none',
              margin: '2px 0 0',
              padding: 0,
              width: '260px',
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              {results.map((m, i) => (
                <li
                  key={m.municipio_id}
                  onMouseDown={() => selectMunicipio(m)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    background: i === activeIndex ? 'var(--cream)' : 'white',
                    borderBottom: '1px solid var(--light-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--navy)' }}>{m.nome}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{m.uf}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active destaque badge */}
        {destaque && activeLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(230,81,0,0.08)', border: '1px solid rgba(230,81,0,0.3)', borderRadius: '4px', padding: '0.25rem 0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#e65100', fontWeight: 600 }}>{activeLabel}</span>
            <button
              onClick={clearDestaque}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e65100', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}
              title="Remover destaque"
            >×</button>
          </div>
        )}

        {/* Back link when navigated from município page */}
        {urlDestaque && destaque === urlDestaque && (
          <a href={`/municipio/${urlDestaque}`} style={{ fontSize: '0.8rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 600, borderLeft: '1px solid var(--light-border)', paddingLeft: '1.5rem' }}>
            ← Voltar ao município
          </a>
        )}

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Data-base: <strong style={{ color: 'var(--navy)' }}>mar/2026</strong>
        </div>
        {loading && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Carregando...</span>}
        {fetchError && <span style={{ color: '#c0392b', fontSize: '0.875rem' }}>Erro: {fetchError}</span>}
      </div>

      {/* Map */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {mapaData && (
          <ChoroplethMap
            valores={mapaData.valores ?? []}
            dominio={mapaData.dominio ?? {}}
            indicador={indicador}
            legendTitle={INDICADORES.find(i => i.chave === indicador)?.label ?? indicador}
            destaque={destaque}
            height={undefined}
          />
        )}
      </div>
    </div>
  )
}

export default function MapaPage() {
  return (
    <Suspense>
      <MapaContent />
    </Suspense>
  )
}
