'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Municipio {
  municipio_id: string
  nome: string
  uf: string
  regiao: string
}

export default function MunicipioSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Municipio[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      setError(null)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/municipios/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setOpen(true)
          setActiveIndex(-1)
        } else {
          setError('Erro ao buscar municípios')
          setOpen(false)
        }
      } catch {
        setError('Erro de conexão')
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  function select(m: Municipio) {
    setQuery(m.nome)
    setOpen(false)
    router.push(`/municipio/${m.municipio_id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      select(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar município..."
          style={{
            width: '100%',
            padding: '0.65rem 1rem 0.65rem 2.5rem',
            border: '1px solid var(--light-border)',
            borderRadius: '6px',
            background: 'white',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {/* SVG magnifying glass */}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '0.72rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m13 13 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {loading && (
          <span
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
          >
            ···
          </span>
        )}
      </div>

      {error && query.length >= 2 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid var(--light-border)',
            borderRadius: '6px',
            padding: '0.6rem 1rem',
            marginTop: '4px',
            fontSize: '0.85rem',
            color: '#c0392b',
            zIndex: 200,
          }}
        >
          {error}
        </div>
      )}

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid var(--light-border)',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            margin: '4px 0 0',
            padding: 0,
            listStyle: 'none',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex: 200,
          }}
        >
          {results.map((m, i) => (
            <li
              key={m.municipio_id}
              onMouseDown={() => select(m)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                background: i === activeIndex ? 'rgba(26,39,68,0.06)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--light-border)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                {m.nome}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'white',
                  background: 'var(--navy-light)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  flexShrink: 0,
                  marginLeft: '0.5rem',
                }}
              >
                {m.uf}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !loading && !error && query.length >= 2 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid var(--light-border)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginTop: '4px',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            zIndex: 200,
          }}
        >
          Nenhum município encontrado.
        </div>
      )}
    </div>
  )
}
