import React from 'react'

const paths = {
  // Page icon from Figma
  16: 'M8.098 2.51a.5.5 0 0 1 .256.136l4 4A.5.5 0 0 1 12 7.5H8a.5.5 0 0 1-.5-.5V3.5H5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5V9a.5.5 0 0 1 1 0v3a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 12V4A1.5 1.5 0 0 1 5 2.5h3zM8.5 6.5h2.293L8.5 4.207z',
  24: 'M12.598 5.01a.5.5 0 0 1 .255.136l4 4A.5.5 0 0 1 16.5 10h-4a.5.5 0 0 1-.5-.5V6H8.5a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 1 1 0v6a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 17.5v-11A1.5 1.5 0 0 1 8.5 5h4zM13 9h2.293L13 6.707z',
}

export const DocumentIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--document', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
