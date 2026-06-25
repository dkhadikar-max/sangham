import Image from 'next/image'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<AvatarSize, { px: number; fontSize: string }> = {
  xs: { px: 24, fontSize: '0.625rem' },
  sm: { px: 32, fontSize: '0.75rem' },
  md: { px: 48, fontSize: '1rem' },
  lg: { px: 64, fontSize: '1.25rem' },
  xl: { px: 80, fontSize: '1.5rem' },
}

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
  onClick?: () => void
}

function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ src, name, size = 'md', className, onClick }: AvatarProps) {
  const { px, fontSize } = sizeMap[size]
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: 'var(--surface-sunken)',
        border: '2px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 600,
        color: 'var(--saffron-600)',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform var(--duration-fast) var(--ease-out)',
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? 'avatar'}
          fill
          style={{ objectFit: 'cover' }}
          sizes={`${px}px`}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
