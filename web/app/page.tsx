import MunicipioSearch from '@/components/MunicipioSearch'
import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.5rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem', lineHeight: 1.1 }}>
        Atlas de Desenvolvimento<br/>Financeiro dos Municípios
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '2.5rem', maxWidth: '40rem' }}>
        Indicadores de acesso, profundidade, intermediação, digitalização e desigualdade financeira para todos os municípios brasileiros.
      </p>
      <div style={{ width: '100%', maxWidth: '32rem', marginBottom: '3rem' }}>
        <MunicipioSearch />
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/brasil/mapa" style={{ color: 'var(--navy)', textDecoration: 'none', padding: '0.5rem 1.25rem', border: '1px solid var(--light-border)', borderRadius: '4px', fontSize: '0.875rem' }}>
          Mapa Nacional
        </Link>
        <Link href="/brasil/ranking?indicador=imdf" style={{ color: 'var(--navy)', textDecoration: 'none', padding: '0.5rem 1.25rem', border: '1px solid var(--light-border)', borderRadius: '4px', fontSize: '0.875rem' }}>
          Ranking IMDF
        </Link>
        <Link href="/brasil/clusters" style={{ color: 'var(--navy)', textDecoration: 'none', padding: '0.5rem 1.25rem', border: '1px solid var(--light-border)', borderRadius: '4px', fontSize: '0.875rem' }}>
          Clusters
        </Link>
        <Link href="/metodologia" style={{ color: 'var(--text-muted)', textDecoration: 'none', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
          Metodologia
        </Link>
      </div>
    </div>
  )
}
