import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ maxWidth: '40rem', margin: '8rem auto', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)' }}>Município não encontrado</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>Verifique o código IBGE ou use a busca para encontrar o município.</p>
      <Link href="/" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>Voltar para a busca</Link>
    </div>
  )
}
