import { getClusters } from '@/lib/queries'
import ClusterView from '@/components/ClusterView'

export const revalidate = 3600

export default async function ClustersPage() {
  const clusters = await getClusters()
  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem' }}>
        Perfis de Municípios
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Agrupamento por similaridade de perfil financeiro (k-means, 5 grupos).
      </p>
      <ClusterView clusters={clusters as any} />
    </div>
  )
}
