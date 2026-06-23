export function Skeleton({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return (
    <div
      style={{
        width,
        height,
        background:
          'linear-gradient(90deg, var(--light-border) 25%, #f0ece7 50%, var(--light-border) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
      }}
    />
  )
}
