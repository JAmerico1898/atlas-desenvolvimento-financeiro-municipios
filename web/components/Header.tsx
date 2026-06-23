'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [brasilOpen, setBrasilOpen] = useState(false)

  const isMunicipio = pathname?.startsWith('/municipio')
  const isBrasil = pathname?.startsWith('/brasil')

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--light-border)',
        background: 'var(--cream)',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--navy)',
          fontWeight: 300,
          fontSize: '1.4rem',
          textDecoration: 'none',
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}
      >
        ADFM
      </Link>

      {/* Center links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
        <Link
          href="/municipio"
          style={{
            color: isMunicipio ? 'var(--navy)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: isMunicipio ? 600 : 400,
            borderBottom: isMunicipio ? '2px solid var(--gold)' : '2px solid transparent',
            paddingBottom: '2px',
          }}
        >
          Município
        </Link>

        {/* Brasil dropdown */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setBrasilOpen(true)}
          onMouseLeave={() => setBrasilOpen(false)}
        >
          <span
            style={{
              color: isBrasil ? 'var(--navy)' : 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: isBrasil ? 600 : 400,
              borderBottom: isBrasil ? '2px solid var(--gold)' : '2px solid transparent',
              paddingBottom: '2px',
              cursor: 'pointer',
            }}
          >
            Brasil ▾
          </span>
          {brasilOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'var(--cream)',
                border: '1px solid var(--light-border)',
                borderRadius: '4px',
                minWidth: '140px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                padding: '0.25rem 0',
                marginTop: '4px',
              }}
            >
              {[
                { href: '/brasil/mapa', label: 'Mapa' },
                { href: '/brasil/ranking', label: 'Ranking' },
                { href: '/brasil/clusters', label: 'Clusters' },
                { href: '/brasil/imdf', label: 'IMDF' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'block',
                    padding: '0.5rem 1rem',
                    color: pathname === href ? 'var(--navy)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: pathname === href ? 600 : 400,
                    background: pathname === href ? 'rgba(26,39,68,0.04)' : 'transparent',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link
          href="/sobre"
          style={{
            color: pathname === '/sobre' ? 'var(--navy)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          Sobre
        </Link>
        <Link
          href="/metodologia"
          style={{
            color: pathname === '/metodologia' ? 'var(--navy)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          Metodologia
        </Link>
      </div>
    </nav>
  )
}
