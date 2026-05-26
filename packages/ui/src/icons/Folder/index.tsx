import React from 'react'

const paths = {
  // Folder icon from Figma
  16: 'M6.586 3a1.5 1.5 0 0 1 1.06.44L9.207 5H12a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 12 13H4a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4 3zM4 4a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-5A.5.5 0 0 0 12 6H8.793L6.939 4.146A.5.5 0 0 0 6.586 4zm7 6a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1z',
  24: 'M10.586 6a1.5 1.5 0 0 1 1.06.44L13.208 8H17a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 17 17H7a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 7 6zM7 7a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-6A.5.5 0 0 0 17 9h-4.207L10.94 7.146A.5.5 0 0 0 10.586 7zm9 7a.5.5 0 0 1 0 1H8a.5.5 0 0 1 0-1z',
}

export const FolderIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--folder', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
