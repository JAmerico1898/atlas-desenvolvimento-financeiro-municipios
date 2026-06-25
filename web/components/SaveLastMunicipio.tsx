'use client'
import { useEffect } from 'react'

interface Props { codigo: string; nome: string; uf: string }

export default function SaveLastMunicipio({ codigo, nome, uf }: Props) {
  useEffect(() => {
    if (codigo) localStorage.setItem('last_municipio', JSON.stringify({ codigo, nome, uf }))
  }, [codigo, nome, uf])
  return null
}
