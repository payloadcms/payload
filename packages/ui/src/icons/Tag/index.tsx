import React from 'react'

// Path data from Figma fpl/icons/src/icons/
const paths = {
  // icon-16-tag.tsx
  16: 'M7.793 3a2.5 2.5 0 0 1 1.768.732l3.853 3.854a2 2 0 0 1 0 2.828l-3 3a2 2 0 0 1-2.828 0L3.732 9.561A2.5 2.5 0 0 1 3 7.793V4.5A1.5 1.5 0 0 1 4.5 3zM4.5 4a.5.5 0 0 0-.5.5v3.293c0 .398.158.78.44 1.06l3.853 3.854a1 1 0 0 0 1.414 0l3-3a1 1 0 0 0 0-1.414L8.854 4.439A1.5 1.5 0 0 0 7.793 4zm2 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2m1.59-.402.056.048a.5.5 0 0 0-.069-.057z',
  // icon-24-tag.tsx
  24: 'M11.793 6a2.5 2.5 0 0 1 1.768.732l4.853 4.854a2 2 0 0 1 0 2.828l-4 4a2 2 0 0 1-2.828 0L6.733 13.56A2.5 2.5 0 0 1 6 11.794V7.5A1.5 1.5 0 0 1 7.5 6zM7.5 7l-.1.01a.5.5 0 0 0-.4.49v4.293c0 .398.158.78.44 1.06l4.853 4.854a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0 0-1.414l-4.853-4.854A1.5 1.5 0 0 0 11.794 7zm2 1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m0 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1m2.59-.902.057.048a.5.5 0 0 0-.07-.057z',
}

export type TagIconProps = {
  className?: string
  size?: 16 | 24
}

export function TagIcon({ className, size = 24 }: TagIconProps) {
  return (
    <svg
      className={[className, 'icon icon--tag'].filter(Boolean).join(' ')}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={paths[size]} fill="currentColor" />
    </svg>
  )
}
