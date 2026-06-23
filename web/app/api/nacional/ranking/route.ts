import { NextRequest, NextResponse } from 'next/server'
import { getRanking, VALID_INDICADORES } from '@/lib/queries'

const VALID_UFS = new Set(['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'])
const VALID_REGIOES = new Set(['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'])

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const indicador = searchParams.get('indicador')
  if (!indicador) {
    return NextResponse.json({ error: { code: 'MISSING_PARAM', message: 'indicador é obrigatório' } }, { status: 400 })
  }
  if (!VALID_INDICADORES.has(indicador)) {
    return NextResponse.json({ error: { code: 'INVALID_PARAM', message: 'indicador inválido' } }, { status: 400 })
  }

  const uf = searchParams.get('uf') ?? undefined
  if (uf && !VALID_UFS.has(uf)) {
    return NextResponse.json({ error: { code: 'INVALID_PARAM', message: 'uf inválida' } }, { status: 400 })
  }

  const regiao = searchParams.get('regiao') ?? undefined
  if (regiao && !VALID_REGIOES.has(regiao)) {
    return NextResponse.json({ error: { code: 'INVALID_PARAM', message: 'regiao inválida' } }, { status: 400 })
  }

  const ordemRaw = searchParams.get('ordem') ?? 'desc'
  if (ordemRaw !== 'asc' && ordemRaw !== 'desc') {
    return NextResponse.json({ error: { code: 'INVALID_PARAM', message: 'ordem deve ser asc ou desc' } }, { status: 400 })
  }

  try {
    const data = await getRanking(indicador, {
      uf,
      regiao,
      ordem: ordemRaw,
      page: parseInt(searchParams.get('page') ?? '1'),
      pageSize: parseInt(searchParams.get('page_size') ?? '50'),
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
