import React from 'react'

const paths: Record<16 | 24, string> = {
  16: 'M12.146 3.146a.5.5 0 1 1 .708.708L10.707 6H12.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 1 0v1.793zM6.5 9a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V10.707L3.854 12.854a.5.5 0 1 1-.708-.708L5.293 10H3.5a.5.5 0 0 1 0-1z',
  24: 'M17.146 6.146a.5.5 0 0 1 .708.708L14.707 10H17.5a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 1 0v2.793zM6.854 17.854a.5.5 0 0 1-.708-.708L9.293 14H6.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-2.793z',
}

export const CollapseIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--collapse', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="fill" d={paths[size]} />
  </svg>
)
