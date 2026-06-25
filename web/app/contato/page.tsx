'use client'
import { useState } from 'react'

export default function ContatoPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mensagem.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, mensagem }),
      })
      if (res.ok) {
        setStatus('ok')
      } else {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Erro ao enviar.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Erro de conexão.')
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid var(--light-border)',
    borderRadius: '4px',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    background: '#fff',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  }

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '4rem auto',
        padding: '0 1.5rem',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontSize: '2rem',
          color: 'var(--navy)',
          marginBottom: '0.5rem',
        }}
      >
        Entre em contato
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Dúvidas, sugestões ou comentários sobre o Atlas.
      </p>

      {status === 'ok' ? (
        <div
          style={{
            padding: '1.5rem',
            background: '#eaf7f4',
            borderRadius: '6px',
            border: '1px solid #b2dfdb',
            color: '#1a5c52',
            fontSize: '0.9rem',
          }}
        >
          Mensagem enviada com sucesso. Obrigado pelo contato!
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Nome (opcional)</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>E-mail (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Mensagem *</label>
            <textarea
              required
              rows={5}
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {status === 'error' && (
            <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              alignSelf: 'flex-start',
              padding: '0.625rem 1.5rem',
              background: 'var(--navy)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: status === 'sending' ? 'not-allowed' : 'pointer',
              opacity: status === 'sending' ? 0.7 : 1,
            }}
          >
            {status === 'sending' ? 'Enviando…' : 'Enviar Mensagem'}
          </button>
        </form>
      )}
    </div>
  )
}
