import { NextRequest, NextResponse } from 'next/server'
import { searchMunicipios } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const uf = searchParams.get('uf') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '10')

  if (!q || q.length < 2) return NextResponse.json([])

  try {
    const results = await searchMunicipios(q, uf, limit)
    return NextResponse.json(results)
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
