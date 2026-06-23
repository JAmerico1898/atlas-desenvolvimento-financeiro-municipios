import { NextRequest, NextResponse } from 'next/server'
import { getMunicipio, getVersion } from '@/lib/queries'

export const revalidate = 3600

export async function GET(req: NextRequest, { params }: { params: Promise<{ municipio_id: string }> }) {
  const { municipio_id } = await params
  if (!/^\d{7}$/.test(municipio_id)) {
    return NextResponse.json({ error: { code: 'INVALID_ID', message: 'municipio_id deve ter 7 dígitos' } }, { status: 400 })
  }

  try {
    const data = await getMunicipio(municipio_id)
    if (!data) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Município não encontrado' } }, { status: 404 })

    const version = await getVersion()
    const res = NextResponse.json(data)
    if (version) res.headers.set('X-Dataset-Version', version.versao)
    return res
  } catch (e) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: String(e) } }, { status: 500 })
  }
}
