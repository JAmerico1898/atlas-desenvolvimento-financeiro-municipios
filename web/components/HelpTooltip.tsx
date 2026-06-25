'use client'
import { useState } from 'react'

export default function HelpTooltip({ text }: { text: string }) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)

  const open = pinned || hovered

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle', marginLeft: '0.3rem' }}>
      <button
        onClick={() => setPinned(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '1rem',
          height: '1rem',
          borderRadius: '50%',
          border: '1px solid var(--text-muted)',
          background: pinned ? 'var(--navy)' : 'transparent',
          color: pinned ? 'white' : 'var(--text-muted)',
          fontSize: '0.6rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          lineHeight: 1,
          flexShrink: 0,
          transition: 'background 0.15s, color 0.15s',
        }}
        aria-label="Definição e metodologia"
      >
        ?
      </button>
      {open && (
        <span
          style={{
            position: 'absolute',
            zIndex: 50,
            left: '50%',
            bottom: 'calc(100% + 6px)',
            transform: 'translateX(-50%)',
            width: '18rem',
            background: 'white',
            border: '1px solid var(--light-border)',
            borderRadius: '6px',
            padding: '0.75rem 0.875rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            pointerEvents: 'none',
          }}
        >
          {text}
        </span>
      )}
    </span>
  )
}
