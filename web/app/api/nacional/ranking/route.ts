import { NextRequest, NextResponse } from 'next/server'
import { getRanking } from '@/lib/queries'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const indicador = searchParams.get('indicador')
  if (!indicador) {
    return NextResponse.json({ error: { code: 'MISSING_PARAM', message: 'indicador é obrigatório' } }, { status: 400 })
  }

  try {
    const data = await getRanking(indicador, {
      uf: searchParams.get('uf') ?? undefined,
      regiao: searchParams.get('regiao') ?? undefined,
      ordem: (searchParams.get('ordem') ?? 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') ?? '1'),
      pageSize: parseInt(searchParams.get('page_size') ?? '50'),
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
