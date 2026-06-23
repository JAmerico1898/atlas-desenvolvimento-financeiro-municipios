import sql from './db'

export async function searchMunicipios(q: string, uf?: string, limit = 10) {
  const pattern = `%${q}%`
  if (uf) {
    return sql`SELECT municipio_id, nome, uf, regiao FROM dim_municipio
               WHERE nome ILIKE ${pattern} AND uf = ${uf} LIMIT ${limit}`
  }
  return sql`SELECT municipio_id, nome, uf, regiao FROM dim_municipio
             WHERE nome ILIKE ${pattern} LIMIT ${limit}`
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

  // Group serie by indicador
  const serie3: Record<string, {ponto: string; data_ref: string; valor: number}[]> = {}
  for (const row of serie) {
    if (!serie3[row.indicador]) serie3[row.indicador] = []
    serie3[row.indicador].push({ ponto: row.ponto, data_ref: row.data_ref, valor: Number(row.valor) })
  }

  return { municipio: mun, indicadores: ind, serie3, cluster, referencia: { nacional: natAvgs[0], regiao: regAvgs[0] } }
}

export async function getMapaData(indicador: string, ponto = 't0') {
  let valores: {municipio_id: string; valor: number | null}[]

  if (ponto === 't0') {
    valores = await sql`SELECT municipio_id, ${sql(indicador)} as valor FROM fato_indicadores_municipio`
  } else {
    valores = await sql`SELECT municipio_id, valor FROM fato_serie_3pontos
                        WHERE indicador = ${indicador} AND ponto = ${ponto}`
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
  const { uf, regiao, ordem = 'desc', page = 1, pageSize = 50 } = opts
  const offset = (page - 1) * pageSize

  // Build query dynamically
  const conditions: string[] = []
  if (uf) conditions.push(`d.uf = '${uf}'`)
  if (regiao) conditions.push(`d.regiao = '${regiao}'`)
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const orderDir = ordem === 'asc' ? 'ASC' : 'DESC'

  const items = await sql`
    SELECT ROW_NUMBER() OVER (ORDER BY f.${sql(indicador)} ${sql.unsafe(orderDir)} NULLS LAST) as posicao,
           f.municipio_id, d.nome, d.uf, f.${sql(indicador)} as valor
    FROM fato_indicadores_municipio f
    JOIN dim_municipio d ON d.municipio_id = f.municipio_id
    ${sql.unsafe(where)}
    ORDER BY f.${sql(indicador)} ${sql.unsafe(orderDir)} NULLS LAST
    LIMIT ${pageSize} OFFSET ${offset}`

  const [{ total }] = await sql`
    SELECT COUNT(*) as total FROM fato_indicadores_municipio f
    JOIN dim_municipio d ON d.municipio_id = f.municipio_id
    ${sql.unsafe(where)}`

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
