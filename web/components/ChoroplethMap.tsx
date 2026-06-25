'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface MapValue {
  municipio_id: string
  nome?: string
  uf?: string
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
  legendTitle?: string
  height?: number
  destaque?: string
}


function fmtLegend(v: number | null): string {
  if (v == null) return '—'
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.', ',') + 'M'
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + 'k'
  if (Number.isInteger(v)) return v.toString()
  return v.toFixed(2).replace('.', ',')
}

function fmtTooltipVal(v: number | null, indicador: string): string {
  if (v == null) return 'sem dados'
  if (indicador === 'deserto_bancario') return v === 1 ? 'Deserto bancário' : 'Com cobertura'
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2).replace('.', ',') + 'M'
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1).replace('.', ',') + 'k'
  if (Number.isInteger(v)) return v.toString()
  if (Math.abs(v) < 0.001) return v.toFixed(4).replace('.', ',')
  return v.toFixed(2).replace('.', ',')
}

const NAVY_SCALE = ['#c8dce8', '#a8c4d8', '#6090b2', '#2a3f6a', '#1a2744']
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
  legendTitle,
  height = 600,
  destaque,
}: ChoroplethMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const mapInstance = useRef<{ remove: () => void } | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    let destroyed = false

    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
    }

    const valueMap = new Map<string, number | null>(
      valores.map(v => [v.municipio_id, v.valor])
    )
    const nameMap = new Map<string, { nome: string; uf: string }>(
      valores
        .filter(v => v.nome)
        .map(v => [v.municipio_id, { nome: v.nome!, uf: v.uf ?? '' }])
    )

    const isBinary = indicador === 'deserto_bancario'
    const colors = isBinary ? DESERT_SCALE : NAVY_SCALE
    const p1 = dominio.p1 ?? dominio.min ?? 0
    const p99 = dominio.p99 ?? dominio.max ?? 1

    // Rank map: 1 = highest valor (DESC sort)
    const sortedForRank = [...valores]
      .filter(v => v.valor != null)
      .sort((a, b) => (b.valor as number) - (a.valor as number))
    const rankMap = new Map<string, number>(sortedForRank.map((v, i) => [v.municipio_id, i + 1]))
    const totalComDados = sortedForRank.length

    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (destroyed || !mapRef.current) return

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
            fetch('/geo/municipios-lod1.topojson').then(r => r.json()),
            import('topojson-client'),
          ])
          if (destroyed) return

          const objectKey = Object.keys(topoRes.objects)[0]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const geojson = topoModule.feature(topoRes, topoRes.objects[objectKey]) as any

          for (const feature of geojson.features) {
            const id = feature.properties?.CD_MUN as string | undefined
            const valor = id != null ? valueMap.get(id) : undefined
            let color: string
            if (valor == null || valor === undefined) {
              color = NO_DATA_COLOR
            } else if (isBinary) {
              color = valor === 1 ? colors[1] : colors[0]
            } else {
              color = quantileColor(valor, p1, p99, colors)
            }
            feature.properties._fill = color
          }

          map.addSource('municipios', {
            type: 'geojson',
            data: geojson,
          })

          map.addLayer({
            id: 'municipios-fill',
            type: 'fill',
            source: 'municipios',
            paint: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              'fill-color': ['get', '_fill'] as any,
              'fill-opacity': 1,
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

          // Destaque — filter expressions on the main source (no separate source needed)
          if (destaque) {
            const destaqueStr = String(destaque)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const destaqueFilter = ['==', ['get', 'CD_MUN'], destaqueStr] as any
            map.addLayer({
              id: 'municipio-destaque-fill',
              type: 'fill',
              source: 'municipios',
              filter: destaqueFilter,
              paint: { 'fill-color': 'rgba(255,204,0,0.55)', 'fill-opacity': 1 },
            })
            map.addLayer({
              id: 'municipio-destaque-halo',
              type: 'line',
              source: 'municipios',
              filter: destaqueFilter,
              paint: { 'line-color': 'white', 'line-width': 10 },
            })
            map.addLayer({
              id: 'municipio-destaque',
              type: 'line',
              source: 'municipios',
              filter: destaqueFilter,
              paint: { 'line-color': '#e65100', 'line-width': 5 },
            })
          }

          // Hover tooltip
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'choropleth-popup',
            maxWidth: '240px',
          })

          let lastHoveredCd: string | null = null
          let leaveTimer: ReturnType<typeof setTimeout> | null = null

          map.on('mousemove', 'municipios-fill', (e) => {
            if (destroyed) return
            if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null }
            try { map.getCanvas().style.cursor = 'pointer' } catch { /* map removed */ }
            const feat = e.features?.[0]
            if (!feat) return
            const cd = feat.properties?.CD_MUN as string
            if (!cd) return

            if (cd !== lastHoveredCd) {
              lastHoveredCd = cd
              const info = nameMap.get(cd)
              const valor = valueMap.get(cd) ?? null
              const rank = (!isBinary && rankMap.has(cd)) ? rankMap.get(cd)! : null

              const nomeHtml = info
                ? `<strong>${info.nome}</strong> · <span style="color:#6b6460">${info.uf}</span>`
                : `<strong>${cd}</strong>`
              const valorHtml = `<div style="margin-top:3px;color:#333">${fmtTooltipVal(valor, indicador)}</div>`
              const rankHtml = rank != null
                ? `<div style="margin-top:2px;color:#8a8580;font-size:11px">${rank}° de ${totalComDados}</div>`
                : ''

              popup.setHTML(`<div style="font-size:12px;line-height:1.45;color:#1a2744">${nomeHtml}${valorHtml}${rankHtml}</div>`)
            }
            popup.setLngLat(e.lngLat).addTo(map)
          })

          map.on('mouseleave', 'municipios-fill', () => {
            leaveTimer = setTimeout(() => {
              if (destroyed) return
              try { map.getCanvas().style.cursor = '' } catch { /* map removed */ }
              popup.remove()
              lastHoveredCd = null
            }, 80)
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
      destroyed = true
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [valores, dominio, indicador, destaque, router])

  const isBinary = indicador === 'deserto_bancario'
  const legendColors = isBinary ? DESERT_SCALE : NAVY_SCALE

  return (
    <div style={{ position: 'relative', width: '100%', height: height ? `${height}px` : '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {/* Legend overlay */}
      <div style={{
        position: 'absolute', bottom: '2rem', left: '1rem',
        background: 'rgba(255,255,255,0.92)', borderRadius: '6px',
        padding: '0.5rem 0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        minWidth: '160px', pointerEvents: 'none',
      }}>
        {legendTitle && (
          <div style={{ fontSize: '0.68rem', color: '#5a6a7a', marginBottom: '0.35rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {legendTitle}
          </div>
        )}
        <div style={{ display: 'flex', height: '10px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.3rem' }}>
          {legendColors.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#3a4a5a' }}>
          <span>{fmtLegend(dominio.p1 ?? dominio.min)}</span>
          <span>{fmtLegend(dominio.p99 ?? dominio.max)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.65rem', color: '#8a9aaa' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: NO_DATA_COLOR, flexShrink: 0 }} />
          sem dados
        </div>
      </div>
    </div>
  )
}
