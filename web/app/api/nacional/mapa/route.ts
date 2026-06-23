import { NextRequest, NextResponse } from 'next/server'
import { getMapaData, VALID_INDICADORES } from '@/lib/queries'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const indicador = searchParams.get('indicador')
  const ponto = searchParams.get('ponto') ?? 't0'

  if (!indicador) {
    return NextResponse.json({ error: { code: 'MISSING_PARAM', message: 'indicador é obrigatório' } }, { status: 400 })
  }
  if (!VALID_INDICADORES.has(indicador)) {
    return NextResponse.json({ error: { code: 'INVALID_PARAM', message: 'indicador inválido' } }, { status: 400 })
  }

  const VALID_PONTOS = ['t0', 't_12', 't_24']
  if (!VALID_PONTOS.includes(ponto)) {
    return NextResponse.json({ error: { code: 'INVALID_PONTO', message: 'ponto deve ser t0, t_12 ou t_24' } }, { status: 400 })
  }

  try {
    const data = await getMapaData(indicador, ponto)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
