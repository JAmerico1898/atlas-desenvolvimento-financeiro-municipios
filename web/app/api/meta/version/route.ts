import { NextResponse } from 'next/server'
import { getVersion } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const v = await getVersion()
    if (!v) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Nenhuma versão encontrada' } }, { status: 404 })
    return NextResponse.json(v)
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
