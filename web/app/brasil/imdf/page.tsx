import { getImdf } from '@/lib/queries'
import ImdfPanel from '@/components/ImdfPanel'

export const revalidate = 3600

export default async function ImdfPage() {
  const data = await getImdf()
  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem' }}>
        IMDF — Índice Municipal de Desenvolvimento Financeiro
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '48rem' }}>
        Índice sintético construído por PCA em dois estágios sobre cinco dimensões — acesso, profundidade,
        intermediação financeira, digitalização e desenvolvimento socioeconômico —, normalizado de 0 (menor)
        a 1 (maior desenvolvimento financeiro).
      </p>
      <ImdfPanel distribuicao={data.distribuicao} cargas={data.cargas} variancia_exp={data.variancia_exp} />
    </div>
  )
}
