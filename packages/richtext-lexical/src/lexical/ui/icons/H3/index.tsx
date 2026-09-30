'use client'
import React from 'react'

const headingPath =
  'M7 6.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0V12h6v5.5a.5.5 0 0 0 1 0v-11a.5.5 0 0 0-1 0V11H7z'
const numeralPath = 'M16.59 13.32 A1.5 1.25 0 1 1 18 15 A1.5 1.25 0 1 1 16.59 16.68'

export const H3Icon: React.FC<{
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
    <path d={headingPath} fill="currentColor" />
    <path
      d={numeralPath}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1}
    />
  </svg>
)
