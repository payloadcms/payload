'use client'
import React from 'react'

const path =
  'M14.5 9.25A1.75 1.75 0 0 1 12.75 11H9.5V7.5h3.25c.966 0 1.75.784 1.75 1.75M8 11V7.5A1.5 1.5 0 0 1 9.5 6h3.25a3.25 3.25 0 0 1 2.418 5.422A3.5 3.5 0 0 1 13.5 18h-4A1.5 1.5 0 0 1 8 16.5zm1.5 1.5v4h4a2 2 0 1 0 0-4z'

export const BoldIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={['icon', className].filter(Boolean).join(' ')}
    fill="none"
    focusable="false"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={path} fill="currentColor" fillRule="evenodd" />
  </svg>
)
