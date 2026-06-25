interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { width: 14, height: 14, borderWidth: 2 },
  md: { width: 20, height: 20, borderWidth: 2 },
  lg: { width: 32, height: 32, borderWidth: 3 },
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const { width, height, borderWidth } = sizeMap[size]
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width,
        height,
        borderWidth,
        borderStyle: 'solid',
        borderColor: 'var(--border-default)',
        borderTopColor: 'var(--saffron-500)',
        borderRadius: '50%',
        animation: 'spinAnim 0.7s linear infinite',
        flexShrink: 0,
      }}
      role="status"
      aria-label="Loading"
    />
  )
}

export function SpinnerCenter({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <Spinner size={size} />
    </div>
  )
}
