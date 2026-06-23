'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface MapValue {
  municipio_id: string
  valor: number | null
}

interface ChoroplethMapProps {
  valores: MapValue[]
  dominio: {
    min: number | null
    p1: number | null
    p99: number | null
    max: number | null
  }
  indicador: string
  height?: number
}

const NAVY_SCALE = ['#e8f0f5', '#a8c4d8', '#6090b2', '#2a3f6a', '#1a2744']
const DESERT_SCALE = ['#faf8f5', '#b8860b']
const NO_DATA_COLOR = '#d4d0cb'

function quantileColor(value: number, p1: number, p99: number, colors: string[]): string {
  if (value <= p1) return colors[0]
  if (value >= p99) return colors[colors.length - 1]
  const t = (value - p1) / (p99 - p1)
  const idx = Math.min(Math.floor(t * colors.length), colors.length - 1)
  return colors[idx]
}

export default function ChoroplethMap({
  valores,
  dominio,
  indicador,
  height = 600,
}: ChoroplethMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const mapInstance = useRef<{ remove: () => void } | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Cleanup previous instance
    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
    }

    const valueMap = new Map<string, number | null>(
      valores.map(v => [v.municipio_id, v.valor])
    )
    const isBinary = indicador === 'deserto_bancario'
    const colors = isBinary ? DESERT_SCALE : NAVY_SCALE
    const p1 = dominio.p1 ?? dominio.min ?? 0
    const p99 = dominio.p99 ?? dominio.max ?? 1

    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (!mapRef.current) return

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: 'bg',
              type: 'background',
              paint: { 'background-color': '#faf8f5' },
            },
          ],
        },
        center: [-52, -15],
        zoom: 3.5,
        attributionControl: false,
      })

      mapInstance.current = map

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      )

      map.on('load', async () => {
        try {
          const [topoRes, topoModule] = await Promise.all([
            fetch('/geo/municipios-lod2.topojson').then(r => r.json()),
            import('topojson-client'),
          ])

          // Convert TopoJSON to GeoJSON
          const objectKey = Object.keys(topoRes.objects)[0]
          const geojson = topoModule.feature(topoRes, topoRes.objects[objectKey])

          // Build match expression for fill color
          // [match, [get, 'CD_MUN'], id1, color1, id2, color2, ..., defaultColor]
          const matchExpression: (string | string[])[] = ['match', ['get', 'CD_MUN']]

          for (const [municipio_id, valor] of valueMap.entries()) {
            let color: string
            if (valor == null) {
              color = NO_DATA_COLOR
            } else if (isBinary) {
              color = valor === 1 ? colors[1] : colors[0]
            } else {
              color = quantileColor(valor, p1, p99, colors)
            }
            matchExpression.push(municipio_id, color)
          }
          matchExpression.push(NO_DATA_COLOR) // default

          map.addSource('municipios', {
            type: 'geojson',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: geojson as any,
          })

          map.addLayer({
            id: 'municipios-fill',
            type: 'fill',
            source: 'municipios',
            paint: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              'fill-color': matchExpression as any,
              'fill-opacity': 0.85,
            },
          })

          map.addLayer({
            id: 'municipios-border',
            type: 'line',
            source: 'municipios',
            paint: {
              'line-color': 'rgba(255,255,255,0.3)',
              'line-width': 0.3,
            },
          })

          map.addLayer({
            id: 'municipios-hover',
            type: 'fill',
            source: 'municipios',
            paint: {
              'fill-color': 'rgba(255,255,255,0.2)',
              'fill-opacity': 0,
            },
          })

          // Hover
          let hoveredId: string | number | null = null
          map.on('mousemove', 'municipios-fill', () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', 'municipios-fill', () => {
            map.getCanvas().style.cursor = ''
            if (hoveredId !== null) {
              map.setFeatureState({ source: 'municipios', id: hoveredId }, { hover: false })
              hoveredId = null
            }
          })

          // Click → navigate
          map.on('click', 'municipios-fill', e => {
            const feature = e.features?.[0]
            if (!feature) return
            const cd = feature.properties?.CD_MUN
            if (cd) {
              router.push(`/municipio/${cd}`)
            }
          })
        } catch (err) {
          console.error('ChoroplethMap: failed to load geo data', err)
        }
      })
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [valores, dominio, indicador, router])

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags -- maplibre peer dep */}
      <div ref={mapRef} style={{ width: '100%', height: `${height}px` }} />
    </>
  )
}
