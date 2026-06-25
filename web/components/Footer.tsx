import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--navy)',
        color: '#fff',
        padding: '2rem 2.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '2rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: '1rem',
            letterSpacing: '0.02em',
          }}
        >
          Atlas de Desenvolvimento Financeiro dos Municípios
        </span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
          © 2026 Atlas de Desenvolvimento Financeiro dos Municípios. Todos os direitos reservados.
        </span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
          Prof. José Américo · COPPEAD · FGV · UCAM
        </span>
      </div>

      <Link
        href="/contato"
        style={{
          color: '#4fc3b8',
          textDecoration: 'underline',
          fontSize: '0.875rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          alignSelf: 'center',
        }}
      >
        Dúvidas, Sugestões: Entre em contato
      </Link>
    </footer>
  )
}
