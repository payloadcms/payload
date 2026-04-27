import React from 'react'

import './index.css'

export const DragHandleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={['icon icon--drag-handle', className].filter(Boolean).join(' ')}
    fill="none"
    height={16}
    viewBox="-5 -4 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill"
      d="M6 7.5C6 7.77614 5.77614 8 5.5 8H0.5C0.223858 8 0 7.77614 0 7.5C0 7.22386 0.223858 7 0.5 7H5.5C5.77614 7 6 7.22386 6 7.5ZM6 4C6 4.27614 5.77614 4.5 5.5 4.5H0.5C0.223858 4.5 0 4.27614 0 4C0 3.72386 0.223858 3.5 0.5 3.5H5.5C5.77614 3.5 6 3.72386 6 4ZM6 0.5C6 0.776142 5.77614 1 5.5 1H0.5C0.223858 1 0 0.776142 0 0.5C0 0.223858 0.223858 0 0.5 0H5.5C5.77614 0 6 0.223858 6 0.5Z"
    />
  </svg>
)
