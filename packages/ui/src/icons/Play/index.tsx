import React from 'react'

export const PlayIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--play', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox="0 0 16 16"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 3.87v8.26a.8.8 0 0 0 1.22.68l6.6-4.13a.8.8 0 0 0 0-1.36l-6.6-4.13A.8.8 0 0 0 5 3.87Z"
      fill="currentColor"
    />
  </svg>
)
