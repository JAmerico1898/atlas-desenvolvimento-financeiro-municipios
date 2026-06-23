export default function Metodologia() {
  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '3rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '2rem' }}>
        Metodologia
      </h1>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>Série temporal</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Cada indicador é calculado para três pontos: data-base (t₀ = mar/2026), 12 meses antes (t₋₁₂ = mar/2025) e 24 meses antes (t₋₂₄ = mar/2024). Dados anuais (PIB, IFDM) usam a edição vigente em cada janela.
        </p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>Indicadores</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Cinco dimensões de inclusão financeira: acesso físico, profundidade e uso, intermediação e retenção, digitalização, e desigualdade relativa. Variáveis monetárias log-transformadas antes da padronização.</p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>IMDF e IMB</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Índices-síntese calculados via PCA (primeiro componente). IMDF: crédito, depósitos, acesso, digitalização e profundidade. IMB: acesso e digitalização. Winsorização em p1/p99.</p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>Clusters</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>Agrupamento k-means (k=5) sobre vetores padronizados das dimensões 1–4 e IMDF. Rótulos realinhados por similaridade de centroide entre atualizações para estabilidade visual.</p>
      </section>
      <section>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.75rem' }}>Fonte dos dados</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>ESTBAN (Banco Central), Estatísticas Pix (Banco Central), IBGE (população e PIB), Firjan/IFDM, malha municipal IBGE 2025.</p>
      </section>
    </div>
  )
}
