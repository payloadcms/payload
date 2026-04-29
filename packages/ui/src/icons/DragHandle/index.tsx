import React from 'react'

import './index.scss'

export const DragHandleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={['icon icon--drag-handle', className].filter(Boolean).join(' ')}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill"
      d="M11 11.5C11 11.7761 10.7761 12 10.5 12H5.5C5.22386 12 5 11.7761 5 11.5C5 11.2239 5.22386 11 5.5 11H10.5C10.7761 11 11 11.2239 11 11.5ZM11 8C11 8.27614 10.7761 8.5 10.5 8.5H5.5C5.22386 8.5 5 8.27614 5 8C5 7.72386 5.22386 7.5 5.5 7.5H10.5C10.7761 7.5 11 7.72386 11 8ZM11 4.5C11 4.77614 10.7761 5 10.5 5H5.5C5.22386 5 5 4.77614 5 4.5C5 4.22386 5.22386 4 5.5 4H10.5C10.7761 4 11 4.22386 11 4.5Z"
    />
  </svg>
)
