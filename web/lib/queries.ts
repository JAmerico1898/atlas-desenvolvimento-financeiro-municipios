import sql from './db'

export const VALID_INDICADORES = new Set([
  'dens_agencias','dens_pontos','deserto_bancario','hab_por_ponto',
  'credito_pc','deposito_pc','profundidade_pib','credito_pib','irpb',
  'rcd','sli_pc','irf',
  'pix_tx_pc','pix_val_pib',
  'irc','ird',
  'imb','imdf',
])

export async function searchMunicipios(q: string, uf?: string, limit = 10) {
  const pattern = `%${q}%`
  try {
    if (uf) {
      return await sql`SELECT municipio_id, nome, uf, regiao FROM dim_municipio
                 WHERE unaccent(nome) ILIKE unaccent(${pattern}) AND uf = ${uf}
                 ORDER BY
                   CASE WHEN unaccent(lower(nome)) = unaccent(lower(${q})) THEN 0 ELSE 1 END,
                   length(nome), nome
                 LIMIT ${limit}`
    }
    return await sql`SELECT municipio_id, nome, uf, regiao FROM dim_municipio
               WHERE unaccent(nome) ILIKE unaccent(${pattern})
               ORDER BY
                 CASE WHEN unaccent(lower(nome)) = unaccent(lower(${q})) THEN 0 ELSE 1 END,
                 length(nome), nome
               LIMIT ${limit}`
  } catch {
    // Fallback: unaccent extension not installed
    if (uf) {
      return sql`SELECT municipio_id, nome, uf, regiao FROM dim_municipio
                 WHERE nome ILIKE ${pattern} AND uf = ${uf}
                 ORDER BY
                   CASE WHEN lower(nome) = lower(${q}) THEN 0 ELSE 1 END,
                   length(nome), nome
                 LIMIT ${limit}`
    }
    return sql`SELECT municipio_id, nome, uf, regiao FROM dim_municipio
               WHERE nome ILIKE ${pattern}
               ORDER BY
                 CASE WHEN lower(nome) = lower(${q}) THEN 0 ELSE 1 END,
                 length(nome), nome
               LIMIT ${limit}`
  }
}

export async function getMunicipio(municipio_id: string) {
  const [mun] = await sql`SELECT * FROM dim_municipio WHERE municipio_id = ${municipio_id}`
  if (!mun) return null

  const [ind] = await sql`SELECT * FROM fato_indicadores_municipio WHERE municipio_id = ${municipio_id}`

  const serie = await sql`SELECT ponto, data_ref, indicador, valor FROM fato_serie_3pontos
                          WHERE municipio_id = ${municipio_id} ORDER BY indicador, ponto`

  const cluster = ind?.cluster_id != null
    ? (await sql`SELECT * FROM dim_cluster WHERE cluster_id = ${ind.cluster_id}`)[0]
    : null

  // National averages (computed at query time)
  const natAvgs = await sql`
    SELECT
      AVG(credito_pib) as credito_pib,
      AVG(imdf) as imdf,
      AVG(dens_agencias) as dens_agencias,
      AVG(deposito_pc) as deposito_pc,
      AVG(credito_pc) as credito_pc
    FROM fato_indicadores_municipio`

  // Regional averages
  const regAvgs = await sql`
    SELECT
      AVG(f.credito_pib) as credito_pib,
      AVG(f.imdf) as imdf,
      AVG(f.dens_agencias) as dens_agencias
    FROM fato_indicadores_municipio f
    JOIN dim_municipio d ON d.municipio_id = f.municipio_id
    WHERE d.regiao = ${mun.regiao}`

  const [dimRanks] = await sql`
    SELECT r.*
    FROM (
      SELECT
        f.municipio_id,
        RANK() OVER (ORDER BY f.dens_agencias DESC NULLS LAST)::int AS rank_dens_agencias,
        RANK() OVER (ORDER BY f.dens_pontos DESC NULLS LAST)::int AS rank_dens_pontos,
        RANK() OVER (ORDER BY f.hab_por_ponto ASC NULLS LAST)::int AS rank_hab_por_ponto,
        RANK() OVER (ORDER BY f.credito_pc DESC NULLS LAST)::int AS rank_credito_pc,
        RANK() OVER (ORDER BY f.deposito_pc DESC NULLS LAST)::int AS rank_deposito_pc,
        RANK() OVER (ORDER BY f.credito_pib DESC NULLS LAST)::int AS rank_credito_pib,
        RANK() OVER (ORDER BY f.profundidade_pib DESC NULLS LAST)::int AS rank_profundidade_pib,
        RANK() OVER (ORDER BY f.rcd DESC NULLS LAST)::int AS rank_rcd,
        RANK() OVER (ORDER BY f.sli_pc DESC NULLS LAST)::int AS rank_sli_pc,
        RANK() OVER (ORDER BY f.irf DESC NULLS LAST)::int AS rank_irf,
        RANK() OVER (ORDER BY f.pix_tx_pc DESC NULLS LAST)::int AS rank_pix_tx_pc,
        RANK() OVER (ORDER BY f.pix_val_pib DESC NULLS LAST)::int AS rank_pix_val_pib,
        RANK() OVER (ORDER BY f.irc DESC NULLS LAST)::int AS rank_irc,
        RANK() OVER (ORDER BY f.ird DESC NULLS LAST)::int AS rank_ird,
        RANK() OVER (ORDER BY d.ifdm DESC NULLS LAST)::int AS rank_ifdm,
        RANK() OVER (ORDER BY d.ifdm_emprego_renda DESC NULLS LAST)::int AS rank_ifdm_emprego_renda,
        RANK() OVER (ORDER BY f.imb DESC NULLS LAST)::int AS rank_imb,
        RANK() OVER (ORDER BY f.imdf DESC NULLS LAST)::int AS rank_imdf,
        RANK() OVER (ORDER BY d.pop_total DESC NULLS LAST)::int AS rank_pop,
        RANK() OVER (ORDER BY d.pib DESC NULLS LAST)::int AS rank_pib
      FROM fato_indicadores_municipio f
      JOIN dim_municipio d ON d.municipio_id = f.municipio_id
    ) r
    WHERE r.municipio_id = ${municipio_id}
  `

  // Group serie by indicador
  const serie3: Record<string, {ponto: string; data_ref: string; valor: number}[]> = {}
  for (const row of serie) {
    if (!serie3[row.indicador]) serie3[row.indicador] = []
    serie3[row.indicador].push({ ponto: row.ponto, data_ref: row.data_ref, valor: Number(row.valor) })
  }

  return { municipio: mun, indicadores: ind, serie3, cluster, referencia: { nacional: natAvgs[0], regiao: regAvgs[0] }, dimRanks: dimRanks ?? null }
}

export async function getMapaData(indicador: string, ponto = 't0') {
  if (!VALID_INDICADORES.has(indicador)) throw new Error(`Indicador inválido: ${indicador}`)
  if (!/^[a-z_]+$/.test(indicador)) throw new Error(`Identificador inválido: ${indicador}`)
  let valores: {municipio_id: string; nome: string; uf: string; valor: number | null}[]

  if (ponto === 't0') {
    // indicador is validated against VALID_INDICADORES above — safe to interpolate as identifier
    valores = (await (sql as any)([`SELECT f.municipio_id, d.nome, d.uf, f."${indicador}" as valor FROM fato_indicadores_municipio f JOIN dim_municipio d ON d.municipio_id = f.municipio_id`])) as {municipio_id: string; nome: string; uf: string; valor: number | null}[]
  } else {
    valores = (await sql`SELECT s.municipio_id, d.nome, d.uf, s.valor FROM fato_serie_3pontos s JOIN dim_municipio d ON d.municipio_id = s.municipio_id WHERE s.indicador = ${indicador} AND s.ponto = ${ponto}`) as {municipio_id: string; nome: string; uf: string; valor: number | null}[]
  }

  // Neon HTTP client returns numeric columns as strings — normalize to number|null
  for (const v of valores) {
    v.valor = v.valor != null ? Number(v.valor) : null
  }
  const nums = valores.map(v => v.valor).filter((v): v is number => v != null)
  const sorted = [...nums].sort((a, b) => a - b)
  const p = (pct: number) => sorted[Math.floor(sorted.length * pct)] ?? null

  return {
    indicador,
    ponto,
    dominio: { min: sorted[0] ?? null, p1: p(0.01), p99: p(0.99), max: sorted[sorted.length-1] ?? null },
    valores
  }
}

export async function getRanking(indicador: string, opts: {
  uf?: string; regiao?: string; ordem?: 'asc'|'desc'; page?: number; pageSize?: number
} = {}) {
  if (!VALID_INDICADORES.has(indicador)) throw new Error(`Indicador inválido: ${indicador}`)
  if (!/^[a-z_]+$/.test(indicador)) throw new Error(`Identificador inválido: ${indicador}`)
  const { uf, regiao, ordem = 'desc', page = 1, pageSize = 50 } = opts
  const offset = (page - 1) * pageSize
  const orderDir = ordem === 'asc' ? 'ASC' : 'DESC'
  const ufParam = uf ?? null
  const regiaoParam = regiao ?? null

  // indicador validated above; orderDir is 'ASC'|'DESC' from a ternary — both safe to interpolate
  const col = `"${indicador}"`
  const od = orderDir
  const items = await (sql as any)(
    [
      `SELECT ROW_NUMBER() OVER (ORDER BY f.${col} ${od} NULLS LAST) as posicao, f.municipio_id, d.nome, d.uf, f.${col} as valor FROM fato_indicadores_municipio f JOIN dim_municipio d ON d.municipio_id = f.municipio_id WHERE (`,
      `::text IS NULL OR d.uf = `,
      `) AND (`,
      `::text IS NULL OR d.regiao = `,
      `) ORDER BY f.${col} ${od} NULLS LAST LIMIT `,
      ` OFFSET `,
      ``
    ],
    ufParam, ufParam, regiaoParam, regiaoParam, pageSize, offset
  )

  const [{ total }] = await sql`
    SELECT COUNT(*) as total FROM fato_indicadores_municipio f
    JOIN dim_municipio d ON d.municipio_id = f.municipio_id
    WHERE (${ufParam}::text IS NULL OR d.uf = ${ufParam})
      AND (${regiaoParam}::text IS NULL OR d.regiao = ${regiaoParam})`

  return { total: Number(total), page, items }
}

export async function getClusters() {
  return sql`SELECT * FROM dim_cluster ORDER BY cluster_id`
}

export async function getImdf() {
  const [latest] = await sql`SELECT versao FROM meta_dataset_version ORDER BY data_exec DESC LIMIT 1`
  const versao = latest?.versao ?? ''

  const cargas = await sql`SELECT indice, variavel, carga, variancia_exp FROM meta_imdf WHERE versao = ${versao}`

  const dist = await sql`SELECT imdf FROM fato_indicadores_municipio WHERE imdf IS NOT NULL ORDER BY imdf`

  return {
    distribuicao: dist.map(r => Number(r.imdf)),
    cargas: cargas.filter(r => r.indice === 'imdf').map(r => ({ variavel: r.variavel, carga: Number(r.carga) })),
    variancia_exp: Number(cargas.find(r => r.indice === 'imdf')?.variancia_exp ?? 0)
  }
}

export async function getVersion() {
  const [v] = await sql`SELECT versao, data_exec, data_ref_t0, n_municipios FROM meta_dataset_version ORDER BY data_exec DESC LIMIT 1`
  return v ?? null
}

export async function getFontes() {
  return sql`SELECT * FROM meta_fonte_variavel ORDER BY variavel`
}
