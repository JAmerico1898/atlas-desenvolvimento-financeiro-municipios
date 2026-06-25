'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MunicipioSearch from '@/components/MunicipioSearch'

export default function MunicipioIndexPage() {
  const router = useRouter()

  useEffect(() => {
    const last = typeof window !== 'undefined' ? localStorage.getItem('last_municipio') : null
    if (last) router.replace(`/municipio/${last}`)
  }, [router])

  return (
    <div style={{ maxWidth: '40rem', margin: '6rem auto', padding: '0 2rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 300, color: 'var(--navy)', marginBottom: '1.5rem' }}>
        Buscar município
      </h1>
      <MunicipioSearch />
    </div>
  )
}
