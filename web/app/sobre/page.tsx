import { getFontes, getVersion } from '@/lib/queries'
import { formatDate } from '@/lib/formatters'

export const revalidate = 3600

export default async function Sobre() {
  const [fontes, versao] = await Promise.all([getFontes(), getVersion()])
  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '2rem' }}>
        Sobre
      </h1>
      {versao && (
        <div style={{ padding: '1rem', background: 'white', border: '1px solid var(--light-border)', borderRadius: '4px', marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Versão do dataset: <strong style={{ color: 'var(--navy)' }}>{versao.versao}</strong>  ·
          Referência: {formatDate(versao.data_ref_t0)}  ·
          {versao.n_municipios?.toLocaleString('pt-BR')} municípios
        </div>
      )}
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '1rem' }}>Fontes de dados</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--light-border)' }}>
            {['Variável','Fonte','Natureza','Periodicidade','Verificar'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 400 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(fontes as any[]).map((f: any) => (
            <tr key={f.variavel} style={{ borderBottom: '1px solid var(--light-border)' }}>
              <td style={{ padding: '0.5rem', color: 'var(--navy)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{f.variavel}</td>
              <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{f.fonte}</td>
              <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{f.natureza}</td>
              <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{f.periodicidade}</td>
              <td style={{ padding: '0.5rem' }}>{f.verificar ? <span style={{ color: 'var(--gold)' }}>⚠ sim</span> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Atlas de Desenvolvimento Financeiro dos Municípios · Desenvolvido por José Américo Antunes
      </p>
    </div>
  )
}
