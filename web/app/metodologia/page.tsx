const S = {
  page: { maxWidth: '60rem', margin: '0 auto', padding: '3rem 2rem' },
  h1: { fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem' },
  lead: { color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '3rem', maxWidth: '48rem' },
  h2: { fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '0.5rem', marginTop: '3rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.5rem' },
  h3: { fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 400, color: 'var(--navy)', marginBottom: '0.75rem', marginTop: '2rem' },
  p: { color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.875rem', marginBottom: '1.5rem' },
  th: { textAlign: 'left' as const, padding: '0.5rem 0.75rem', background: 'var(--navy)', color: 'white', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.04em' },
  td: { padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--light-border)', color: 'var(--text-secondary)', verticalAlign: 'top' as const },
  tdCode: { padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--light-border)', verticalAlign: 'top' as const, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--navy)', whiteSpace: 'nowrap' as const },
  code: { fontFamily: 'monospace', fontSize: '0.85em', background: 'rgba(26,39,68,0.07)', borderRadius: '3px', padding: '1px 5px', color: 'var(--navy)' },
  formula: { fontFamily: 'monospace', fontSize: '0.9rem', background: 'rgba(26,39,68,0.05)', border: '1px solid var(--light-border)', borderRadius: '6px', padding: '0.75rem 1rem', margin: '0.5rem 0 1rem', color: 'var(--navy)', display: 'block' },
  badge: (color: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 600, background: color, color: 'white', marginRight: '4px' }),
  note: { background: 'rgba(184,134,11,0.07)', border: '1px solid rgba(184,134,11,0.3)', borderRadius: '6px', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.25rem' },
  phase: { background: 'rgba(26,39,68,0.04)', border: '1px solid var(--light-border)', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1rem' },
  phaseTitleRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' },
  dimTag: (n: number) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.8rem', height: '1.8rem', borderRadius: '50%', background: 'var(--navy)', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }),
}

function Code({ children }: { children: string }) {
  return <code style={S.code}>{children}</code>
}

export default function Metodologia() {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Metodologia</h1>
      <p style={S.lead}>
        O Atlas de Desenvolvimento Financeiro dos Municípios (ADFM) mede o acesso, a profundidade,
        a intermediação, a digitalização e a desigualdade do sistema financeiro em cada um dos
        5.570 municípios brasileiros, com base em dados públicos do Banco Central, IBGE e Firjan.
        Esta página documenta todas as variáveis, fórmulas e índices-síntese calculados pelo modelo.
      </p>

      {/* ── 1. Fontes de dados ─────────────────────────────── */}
      <h2 style={S.h2}>1. Fontes de dados</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Fonte</th>
            <th style={S.th}>Variáveis coletadas</th>
            <th style={S.th}>Natureza</th>
            <th style={S.th}>Periodicidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.td}><strong>ESTBAN — Banco Central</strong></td>
            <td style={S.td}><Code>saldo_credito</Code>, <Code>dep_vista</Code>, <Code>dep_poupanca</Code>, <Code>dep_prazo</Code>, <Code>num_agencias</Code></td>
            <td style={S.td}>Estoque (saldos contábeis em data‑base)</td>
            <td style={S.td}>Mensal</td>
          </tr>
          <tr>
            <td style={S.td}><strong>Estatísticas Pix — Banco Central</strong></td>
            <td style={S.td}><Code>pix_qtd_transacoes</Code>, <Code>pix_valor</Code></td>
            <td style={S.td}>Fluxo</td>
            <td style={S.td}>Mensal</td>
          </tr>
          <tr>
            <td style={S.td}><strong>Canais de Atendimento — Banco Central</strong></td>
            <td style={S.td}><Code>num_postos</Code>, <Code>num_paes</Code></td>
            <td style={S.td}>Estoque</td>
            <td style={S.td}>Periódico</td>
          </tr>
          <tr>
            <td style={S.td}><strong>IBGE</strong></td>
            <td style={S.td}><Code>pop_total</Code> (estimativas populacionais), <Code>pib</Code> (preços correntes, último ano disponível), malha municipal</td>
            <td style={S.td}>Estoque / Fluxo / Geo</td>
            <td style={S.td}>Anual</td>
          </tr>
          <tr>
            <td style={S.td}><strong>Firjan — Atlas do Desenvolvimento Humano</strong></td>
            <td style={S.td}><Code>ifdm</Code> (índice geral), <Code>ifdm_emprego_renda</Code></td>
            <td style={S.td}>Índice sintético</td>
            <td style={S.td}>2023</td>
          </tr>
        </tbody>
      </table>
      <p style={{ ...S.p, fontSize: '0.85rem' }}>
        Chave universal: código IBGE do município (7 dígitos, tipo texto). Todas as fontes são
        reconciliadas para esse identificador antes do cálculo dos indicadores.
      </p>

      {/* ── 2. Convenções de cálculo ───────────────────────── */}
      <h2 style={S.h2}>2. Convenções de cálculo</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Convenção</th>
            <th style={S.th}>Descrição</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>Per capita / densidades</td>
            <td style={S.td}>Denominador = <Code>pop_total</Code> para per capita. Densidades expressas por 10.000 habitantes.</td>
          </tr>
          <tr>
            <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>Normalização</td>
            <td style={S.td}>Todas as variáveis de entrada dos índices são normalizadas min‑max para [0, 1] antes do PCA. Valores ausentes recebem 0 (mediana do intervalo normalizado).</td>
          </tr>
          <tr>
            <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>Winsorização</td>
            <td style={S.td}>Variáveis com outliers extremos são winsorizadas em p0,5 / p99,5 antes do cálculo de índices e da escala de cor nos mapas.</td>
          </tr>
          <tr>
            <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>Zeros no denominador</td>
            <td style={S.td}>Quando o denominador pode ser zero (agências, depósitos), o resultado é definido como <Code>NULL</Code> ou substituído por flag categórico — nunca por divisão por zero.</td>
          </tr>
          <tr>
            <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>Estoque × fluxo</td>
            <td style={S.td}>Razões entre fluxo e estoque são evitadas, com exceção consagrada de <Code>credito_pib</Code> (saldo de crédito ÷ PIB anual), com data de referência fixada.</td>
          </tr>
          <tr>
            <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>Sentido dos índices</td>
            <td style={S.td}>Score = 1 representa o melhor desempenho financeiro; score = 0 o pior. Scores mais altos equivalem a maior desenvolvimento financeiro.</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. Dimensão 1 ──────────────────────────────────── */}
      <h2 style={S.h2}>3. Dimensão 1 — Acesso Físico</h2>
      <p style={S.p}>
        Mede a presença de infraestrutura financeira no território. Engloba agências bancárias
        e demais pontos de atendimento regulados pelo Banco Central.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Variável</th>
            <th style={S.th}>Conceito</th>
            <th style={S.th}>Fórmula</th>
            <th style={S.th}>Tratamento</th>
            <th style={S.th}>Fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.tdCode}>dens_agencias</td>
            <td style={S.td}>Densidade de agências bancárias por 10 mil habitantes</td>
            <td style={S.td}><code style={S.code}>num_agencias / pop_total × 10.000</code></td>
            <td style={S.td}>Winsor p99,5</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>dens_pontos</td>
            <td style={S.td}>Densidade total de pontos de atendimento por 10 mil habitantes. Inclui agências, postos de atendimento (PAB/PAE) e PAEs.</td>
            <td style={S.td}><code style={S.code}>(num_agencias + num_postos + num_paes) / pop_total × 10.000</code></td>
            <td style={S.td}>Winsor p99,5</td>
            <td style={S.td}>ESTBAN + Canais / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>deserto_bancario</td>
            <td style={S.td}>Flag categórico: município sem nenhum ponto de atendimento bancário registrado</td>
            <td style={S.td}><code style={S.code}>1 se (num_agencias + num_postos) = 0; senão 0</code></td>
            <td style={S.td}>—</td>
            <td style={S.td}>ESTBAN + Canais / BCB</td>
          </tr>
          <tr>
            <td style={S.tdCode}>hab_por_ponto</td>
            <td style={S.td}>Número de habitantes por ponto de atendimento. Inverso de <Code>dens_pontos</Code> — quanto maior, menor a cobertura.</td>
            <td style={S.td}><code style={S.code}>pop_total / (num_agencias + num_postos) = 10.000 / dens_pontos</code></td>
            <td style={S.td}>NULL se denominador = 0; Winsor p99,5</td>
            <td style={S.td}>ESTBAN + Canais / BCB; IBGE</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. Dimensão 2 ──────────────────────────────────── */}
      <h2 style={S.h2}>4. Dimensão 2 — Profundidade e Uso</h2>
      <p style={S.p}>
        Mede o volume de crédito e depósitos em relação à economia e população local,
        indicando o quanto o sistema financeiro penetra na atividade econômica do município.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Variável</th>
            <th style={S.th}>Conceito</th>
            <th style={S.th}>Fórmula</th>
            <th style={S.th}>Tratamento</th>
            <th style={S.th}>Fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.tdCode}>credito_pc</td>
            <td style={S.td}>Saldo total de crédito per capita (R$)</td>
            <td style={S.td}><code style={S.code}>saldo_credito / pop_total</code></td>
            <td style={S.td}>Winsor p99,5</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>deposito_pc</td>
            <td style={S.td}>Saldo total de depósitos (vista + poupança + prazo) per capita (R$)</td>
            <td style={S.td}><code style={S.code}>(dep_vista + dep_poupanca + dep_prazo) / pop_total</code></td>
            <td style={S.td}>Winsor p99,5</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>profundidade_pib</td>
            <td style={S.td}>Profundidade financeira: soma de crédito e depósitos em proporção ao PIB local</td>
            <td style={S.td}><code style={S.code}>(saldo_credito + depositos_total) / pib</code></td>
            <td style={S.td}>Winsor p99,5</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>credito_pib</td>
            <td style={S.td}>Razão crédito / PIB — intensidade do crédito na economia local</td>
            <td style={S.td}><code style={S.code}>saldo_credito / pib</code></td>
            <td style={S.td}>Winsor p99,5; data‑ref fixada</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>irpb</td>
            <td style={S.td}>Índice Relativo de Profundidade Bancária: razão entre a intensidade de crédito local e a média nacional agregada, indicando se o município está acima ou abaixo da média do país</td>
            <td style={S.td}><code style={S.code}>credito_pib_i / (Σ saldo_credito / Σ pib)</code></td>
            <td style={S.td}>—</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
        </tbody>
      </table>
      <div style={S.note}>
        <strong>Nota sobre depósitos:</strong> <Code>depositos_total = dep_vista + dep_poupanca + dep_prazo</Code>.
        A ESTBAN registra saldos contábeis do balancete das instituições financeiras localizadas no município —
        não reflete necessariamente residência do titular.
      </div>

      {/* ── 2. Dimensão 3 ──────────────────────────────────── */}
      <h2 style={S.h2}>5. Dimensão 3 — Intermediação e Retenção Financeira</h2>
      <p style={S.p}>
        Avalia se o sistema financeiro local mobiliza a poupança e a reinveste na forma de crédito,
        e o grau de equilíbrio entre os dois lados do balanço bancário.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Variável</th>
            <th style={S.th}>Conceito</th>
            <th style={S.th}>Fórmula</th>
            <th style={S.th}>Tratamento</th>
            <th style={S.th}>Fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.tdCode}>rcd</td>
            <td style={S.td}>Razão Crédito / Depósito — mede o quanto o crédito local é lastreado em depósitos captados no próprio município</td>
            <td style={S.td}><code style={S.code}>saldo_credito / depositos_total</code></td>
            <td style={S.td}>Winsor p99,5; NULL se depósitos = 0</td>
            <td style={S.td}>ESTBAN / BCB</td>
          </tr>
          <tr>
            <td style={S.tdCode}>sli_pc</td>
            <td style={S.td}>Saldo Líquido de Intermediação per capita — diferença entre o crédito concedido e os depósitos captados, por habitante. Negativo indica que o município capta mais do que empresta.</td>
            <td style={S.td}><code style={S.code}>(saldo_credito − depositos_total) / pop_total</code></td>
            <td style={S.td}>Winsor p99,5</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>irf</td>
            <td style={S.td}>Índice de Retenção Financeira — mede o equilíbrio entre crédito e depósitos. Valor 1 significa equilíbrio perfeito (crédito = depósitos); valor 0 significa desequilíbrio máximo.</td>
            <td style={S.td}><code style={S.code}>1 − |saldo_credito − depositos_total| / (saldo_credito + depositos_total)</code></td>
            <td style={S.td}>Limitado ao intervalo [0, 1]; NULL se ambos = 0</td>
            <td style={S.td}>ESTBAN / BCB</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. Dimensão 4 ──────────────────────────────────── */}
      <h2 style={S.h2}>6. Dimensão 4 — Digitalização</h2>
      <p style={S.p}>
        Mede a adoção de pagamentos digitais instantâneos via Pix, capturando a penetração do
        sistema financeiro digital na economia local. Variáveis de fluxo (transações no período).
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Variável</th>
            <th style={S.th}>Conceito</th>
            <th style={S.th}>Fórmula</th>
            <th style={S.th}>Tratamento</th>
            <th style={S.th}>Fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.tdCode}>pix_tx_pc</td>
            <td style={S.td}>Número de transações Pix per capita no período (pagadores + recebedores, PF e PJ)</td>
            <td style={S.td}><code style={S.code}>pix_qtd_transacoes / pop_total</code></td>
            <td style={S.td}>Winsor p99,5</td>
            <td style={S.td}>Estatísticas Pix / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>pix_val_pib</td>
            <td style={S.td}>Valor total movimentado via Pix em proporção ao PIB local — indica o peso econômico dos pagamentos digitais</td>
            <td style={S.td}><code style={S.code}>pix_valor / pib</code></td>
            <td style={S.td}>—</td>
            <td style={S.td}>Estatísticas Pix / BCB; IBGE</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. Dimensão 5 ──────────────────────────────────── */}
      <h2 style={S.h2}>7. Dimensão 5 — Desigualdade Relativa</h2>
      <p style={S.p}>
        Compara o município com a média nacional, revelando se seu sistema financeiro está
        acima ou abaixo da média do país dado seu nível de desenvolvimento humano.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Variável</th>
            <th style={S.th}>Conceito</th>
            <th style={S.th}>Fórmula</th>
            <th style={S.th}>Tratamento</th>
            <th style={S.th}>Fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.tdCode}>irc</td>
            <td style={S.td}>Índice Relativo de Crédito — razão entre o crédito per capita do município e a média nacional. Valor {'>'} 1 indica acima da média.</td>
            <td style={S.td}><code style={S.code}>credito_pc_i / média_nacional(credito_pc)</code></td>
            <td style={S.td}>—</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>ird</td>
            <td style={S.td}>Índice Relativo de Depósitos — razão entre os depósitos per capita do município e a média nacional.</td>
            <td style={S.td}><code style={S.code}>deposito_pc_i / média_nacional(deposito_pc)</code></td>
            <td style={S.td}>—</td>
            <td style={S.td}>ESTBAN / BCB; IBGE</td>
          </tr>
          <tr>
            <td style={S.tdCode}>resid_imb_idhm</td>
            <td style={S.td}>Resíduo da regressão OLS entre o IMB e o IFDM (Firjan). Mede o quanto da bancarização do município não é explicado pelo seu nível de desenvolvimento econômico geral. Resíduo positivo: município financeiramente mais inclusivo do que o esperado para seu IFDM.</td>
            <td style={S.td}><code style={S.code}>ε de IMB = α + β·IFDM + ε</code></td>
            <td style={S.td}>Média ≈ 0 por construção</td>
            <td style={S.td}>IMB (calculado); Firjan</td>
          </tr>
        </tbody>
      </table>

      {/* ── 2. IMB ─────────────────────────────────────────── */}
      <h2 style={S.h2}>8. IMB — Índice Municipal de Bancarização</h2>
      <p style={S.p}>
        O IMB resume em um único score o grau de bancarização do município, combinando infraestrutura
        física e digitalização. É calculado por PCA de fase única sobre cinco variáveis de acesso.
      </p>

      <h3 style={S.h3}>Variáveis de entrada</h3>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Variável</th>
            <th style={S.th}>Dimensão de origem</th>
            <th style={S.th}>Justificativa</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={S.tdCode}>dens_agencias</td><td style={S.td}>D1 – Acesso</td><td style={S.td}>Densidade de agências formais</td></tr>
          <tr><td style={S.tdCode}>dens_pontos</td><td style={S.td}>D1 – Acesso</td><td style={S.td}>Densidade total de pontos físicos</td></tr>
          <tr><td style={S.tdCode}>valor_pix_pc</td><td style={S.td}>D4 – Digitalização</td><td style={S.td}>Volume de Pix por habitante (proxy de conta ativa)</td></tr>
          <tr><td style={S.tdCode}>deposito_pc</td><td style={S.td}>D2 – Profundidade</td><td style={S.td}>Captação por habitante (bancarização passiva)</td></tr>
          <tr><td style={S.tdCode}>credito_pc</td><td style={S.td}>D2 – Profundidade</td><td style={S.td}>Crédito por habitante (bancarização ativa)</td></tr>
        </tbody>
      </table>

      <h3 style={S.h3}>Procedimento de cálculo</h3>
      <div style={S.phase}>
        <div style={S.phaseTitleRow}>
          <span style={{ ...S.badge('var(--navy)'), fontSize: '0.75rem' }}>Etapa 1</span>
          <strong style={{ color: 'var(--navy)' }}>Normalização min‑max</strong>
        </div>
        <p style={{ ...S.p, marginBottom: 0 }}>
          Cada variável é normalizada individualmente para [0, 1] usando os valores mínimo e máximo
          observados em <Code>t0</Code>. Valores ausentes são preenchidos com 0 (não penalizam nem beneficiam).
        </p>
        <code style={S.formula}>x_norm = (x − min) / (max − min)</code>
      </div>
      <div style={S.phase}>
        <div style={S.phaseTitleRow}>
          <span style={{ ...S.badge('var(--navy)'), fontSize: '0.75rem' }}>Etapa 2</span>
          <strong style={{ color: 'var(--navy)' }}>PCA — 1º componente principal</strong>
        </div>
        <p style={{ ...S.p, marginBottom: 0 }}>
          As cinco variáveis normalizadas formam a matriz X (5570 × 5). A PCA é ajustada sobre
          esse conjunto e retém apenas o <strong>1º componente principal</strong>, que maximiza a variância
          explicada. O score de cada município é o produto interno do seu vetor x_norm pelas cargas (loadings) do 1º componente.
        </p>
      </div>
      <div style={S.phase}>
        <div style={S.phaseTitleRow}>
          <span style={{ ...S.badge('var(--navy)'), fontSize: '0.75rem' }}>Etapa 3</span>
          <strong style={{ color: 'var(--navy)' }}>Escalonamento final</strong>
        </div>
        <p style={{ ...S.p, marginBottom: 0 }}>
          O score do 1º componente é novamente normalizado min‑max para [0, 1], garantindo
          que IMB = 1 seja o município mais bancarizado e IMB = 0 o menos bancarizado do conjunto.
        </p>
      </div>
      <div style={S.note}>
        As cargas (loadings) e a variância explicada pelo 1º componente são persistidas na tabela{' '}
        <Code>meta_imdf</Code> a cada atualização, permitindo auditoria e reprodução dos resultados.
      </div>

      {/* ── 2. IMDF ───────────────────────────────────────── */}
      <h2 style={S.h2}>9. IMDF — Índice Municipal de Desenvolvimento Financeiro</h2>
      <p style={S.p}>
        O IMDF é o índice-síntese central do Atlas. Combina as cinco dimensões de análise em um
        único score de desenvolvimento financeiro, usando uma <strong>PCA de duas fases</strong>:
        primeiro comprime cada dimensão em um score dimensional; depois combina os cinco scores
        dimensionais em um score final.
      </p>
      <div style={S.note}>
        <strong>Por que duas fases?</strong> A PCA direta sobre todas as variáveis daria peso
        desproporcionalmente maior a dimensões com mais variáveis (D2 tem 4, D4 tem apenas 1).
        A PCA bifásica equaliza a contribuição de cada dimensão ao índice final,
        independentemente do número de variáveis que a compõem.
      </div>

      <h3 style={S.h3}>Fase 1 — PCA por dimensão</h3>
      <p style={S.p}>
        Para cada uma das cinco dimensões, aplica-se uma PCA independente sobre as variáveis
        que a compõem (após normalização min‑max). O score do 1º componente de cada dimensão
        é normalizado min‑max para [0, 1]:
      </p>

      {[
        { dim: 'D1', name: 'Acesso Físico', vars: ['dens_agencias', 'dens_pontos'], note: '2 variáveis' },
        { dim: 'D2', name: 'Profundidade e Uso', vars: ['credito_pc', 'deposito_pc', 'credito_pib', 'profundidade_pib'], note: '4 variáveis' },
        { dim: 'D3', name: 'Intermediação e Retenção', vars: ['rcd', 'irf'], note: '2 variáveis' },
        { dim: 'D4', name: 'Digitalização', vars: ['pix_tx_pc'], note: '1 variável → min‑max direto (sem PCA)' },
        { dim: 'D5', name: 'Desigualdade Relativa', vars: ['ifdm', 'ifdm_emprego_renda'], note: '2 variáveis (índices Firjan)' },
      ].map(({ dim, name, vars, note }) => (
        <div key={dim} style={S.phase}>
          <div style={S.phaseTitleRow}>
            <span style={S.dimTag(1)}>{dim.replace('D', '')}</span>
            <div>
              <strong style={{ color: 'var(--navy)' }}>{name}</strong>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>({note})</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem' }}>
            {vars.map(v => <code key={v} style={{ ...S.code, fontSize: '0.82rem' }}>{v}</code>)}
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center' }}>→ <Code>{`score_${dim.toLowerCase()}`}</Code> ∈ [0, 1]</span>
          </div>
        </div>
      ))}

      <h3 style={S.h3}>Fase 2 — PCA dos scores dimensionais → IMDF</h3>
      <div style={S.phase}>
        <div style={S.phaseTitleRow}>
          <span style={{ ...S.badge('#b8860b'), fontSize: '0.75rem' }}>PCA Final</span>
          <strong style={{ color: 'var(--navy)' }}>Combinação dos 5 scores dimensionais</strong>
        </div>
        <p style={{ ...S.p, marginBottom: '0.5rem' }}>
          Os cinco scores normalizados [<Code>score_d1</Code>, <Code>score_d2</Code>, <Code>score_d3</Code>, <Code>score_d4</Code>, <Code>score_d5</Code>]
          formam uma nova matriz (5570 × 5). Uma nova PCA é ajustada sobre esse conjunto e retém o 1º componente.
        </p>
        <p style={{ ...S.p, marginBottom: 0 }}>
          O score final é novamente normalizado min‑max para [0, 1]:
        </p>
        <code style={S.formula}>IMDF = minmax( PCA₂(score_d1, score_d2, score_d3, score_d4, score_d5)[1º componente] )</code>
      </div>

      <h3 style={S.h3}>Resumo do fluxo de cálculo</h3>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Etapa</th>
            <th style={S.th}>Entrada</th>
            <th style={S.th}>Saída</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={S.td}>Normalização</td><td style={S.td}>Variáveis brutas</td><td style={S.td}>Cada variável ∈ [0, 1]</td></tr>
          <tr><td style={S.td}>PCA Fase 1 (× 5)</td><td style={S.td}>Variáveis por dimensão</td><td style={S.td}><Code>score_d1</Code> … <Code>score_d5</Code>, cada ∈ [0, 1]</td></tr>
          <tr><td style={S.td}>PCA Fase 2</td><td style={S.td}><Code>score_d1</Code> … <Code>score_d5</Code></td><td style={S.td}>Score bruto do 1º componente</td></tr>
          <tr><td style={S.td}>Escalonamento final</td><td style={S.td}>Score bruto</td><td style={S.td}><Code>IMDF</Code> ∈ [0, 1]</td></tr>
        </tbody>
      </table>
      <div style={S.note}>
        <strong>Ancoragem em t₀:</strong> todos os parâmetros de normalização (min, max) e os vetores
        de carga (loadings) da PCA são computados exclusivamente sobre os dados de <Code>t0</Code>. Os mesmos
        parâmetros são aplicados a <Code>t_12</Code> e <Code>t_24</Code>, garantindo que variações no IMDF
        entre períodos reflitam mudanças reais nos municípios — e não redistribuição estatística da amostra.
      </div>

      {/* ── 2. Rankings ───────────────────────────────────── */}
      <h2 style={S.h2}>10. Rankings</h2>
      <p style={S.p}>
        Os rankings nacional e estadual são calculados com base no <Code>IMDF</Code> de <Code>t0</Code>,
        usando ordenação descendente (posição 1 = maior IMDF). Em caso de empate, aplica-se o método <em>min</em>
        (ambos os municípios recebem a menor posição do empate). Municípios sem dados suficientes para
        o cálculo do IMDF recebem <Code>NULL</Code> no ranking.
      </p>

      {/* ── 2. Clusters ───────────────────────────────────── */}
      <h2 style={S.h2}>11. Clusters de Municípios</h2>
      <p style={S.p}>
        Os municípios são agrupados em <strong>5 perfis</strong> por k‑means aplicado sobre o vetor
        padronizado dos cinco scores dimensionais mais o IMDF:
      </p>
      <code style={S.formula}>vetor = [score_d1, score_d2, score_d3, score_d4, score_d5, imdf]</code>
      <p style={S.p}>
        O k‑means é recalculado a cada atualização dos dados. Para garantir estabilidade visual
        entre versões (evitar que o cluster "1 — Muito Alto" se torne o cluster "3 — Médio" após
        uma atualização), os rótulos são realinhados por <strong>similaridade de centroide</strong>:
        após o recálculo, cada novo centroide é associado ao centroide anterior mais próximo
        (distância euclidiana no espaço normalizado), e o rótulo do centroide anterior é herdado.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Cluster</th>
            <th style={S.th}>Perfil típico</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['1 — Muito Alto', 'Grandes centros urbanos e capitais com ampla infraestrutura, alto crédito e forte digitalização'],
            ['2 — Alto', 'Cidades médias com boa cobertura bancária e desempenho acima da média nacional'],
            ['3 — Médio', 'Municípios com cobertura básica e indicadores próximos à mediana nacional'],
            ['4 — Baixo', 'Municípios com infraestrutura limitada, crédito e digitalização abaixo da média'],
            ['5 — Muito Baixo / Deserto', 'Municípios com mínima ou nenhuma infraestrutura financeira — frequentemente categorizados como desertos bancários'],
          ].map(([label, desc]) => (
            <tr key={label}>
              <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>{label}</td>
              <td style={S.td}>{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 2. Geo ────────────────────────────────────────── */}
      <h2 style={S.h2}>12. Dados Geográficos</h2>
      <p style={S.p}>
        A malha municipal utilizada nos mapas é derivada da malha oficial do IBGE (2025),
        simplificada e convertida para o formato <strong>TopoJSON</strong> em dois níveis de
        detalhe (LOD):
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Arquivo</th>
            <th style={S.th}>Uso</th>
            <th style={S.th}>Tamanho aproximado</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={S.tdCode}>municipios-lod1.topojson</td><td style={S.td}>Mapa coroplético nacional (resolução padrão)</td><td style={S.td}>~3 MB</td></tr>
          <tr><td style={S.tdCode}>municipios-lod0.topojson</td><td style={S.td}>Mapa de alta resolução (zoom avançado)</td><td style={S.td}>~8 MB</td></tr>
        </tbody>
      </table>
      <p style={S.p}>
        Cada feature TopoJSON carrega a propriedade <Code>CD_MUN</Code> (7 dígitos, string) como
        chave de junção com os dados do banco. Os arquivos são servidos diretamente pelo CDN do Vercel —
        não há consulta PostGIS.
      </p>

      {/* ── footer note ────────────────────────────────────── */}
      <div style={{ ...S.note, marginTop: '3rem' }}>
        <strong>Reprodução:</strong> Toda a cadeia de processamento — ETL, cálculo de indicadores,
        PCA e publicação no banco — é implementada em Python (diretório <Code>pipeline/</Code>) e
        versionada no repositório público do projeto. As cargas PCA e a variância explicada de cada
        componente são persistidas na tabela <Code>meta_imdf</Code> a cada execução do pipeline,
        permitindo auditoria completa dos resultados.
      </div>
    </div>
  )
}
