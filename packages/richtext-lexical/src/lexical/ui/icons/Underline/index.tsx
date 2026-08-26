'use client'
import React from 'react'

const path =
  'M9 7.5a.5.5 0 0 0-1 0V12a4 4 0 0 0 8 0V7.5a.5.5 0 0 0-1 0V12a3 3 0 1 1-6 0zM16.5 19a.5.5 0 0 0 0-1h-9a.5.5 0 0 0 0 1z'

export const UnderlineIcon: React.FC<{
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
