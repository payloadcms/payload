import React from 'react'

import './index.css'

const paths = {
  16: 'M6.75 3C7.22207 3 7.66691 3.221995 7.9502 3.599609L9 5H12.5C13.3284 5 14 5.67157 14 6.5V11.5C14 12.32843 13.3284 13 12.5 13H3.5C2.671573 13 2 12.32843 2 11.5V4.5C2 3.671573 2.671573 3 3.5 3H6.75ZM3.5 4C3.22386 4 3 4.22386 3 4.5V11.5C3 11.77614 3.22386 12 3.5 12H12.5C12.7761 12 13 11.77614 13 11.5V6.5C13 6.22386 12.7761 6 12.5 6H8.5L8.34961 5.7998L7.15039 4.2002C7.05596 4.07429 6.90738 4 6.75 4H3.5ZM6.25 5C6.52614 5 6.75 5.22386 6.75 5.5C6.75 5.77614 6.52614 6 6.25 6H4.5C4.22386 6 4 5.77614 4 5.5C4 5.22386 4.22386 5 4.5 5H6.25Z',
  24: 'M7 7h3.882l.5 1H7zM6 8V7a1 1 0 0 1 1-1h3.882a1 1 0 0 1 .894.553L12.5 8h4A1.5 1.5 0 0 1 18 9.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 15.5zm7 1H7v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5z',
}

export const FolderIcon: React.FC<{
  readonly className?: string
  color?: 'dark' | 'default' | 'muted'
  readonly size?: 16 | 24
}> = ({ className, color, size = 24 }) => (
  <svg
    className={['icon', 'icon--folder', color ? `icon--folder--${color}` : '', className]
      .filter(Boolean)
      .join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
