'use client'
import React from 'react'

const path =
  'M7 6.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0V12h6v5.5a.5.5 0 0 0 1 0v-11a.5.5 0 0 0-1 0V11H7zm11 6a.5.5 0 0 0-.777-.416l-1.5 1a.5.5 0 1 0 .554.832l.723-.482V17.5a.5.5 0 0 0 1 0z'

export const H1Icon: React.FC<{
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
    <path d={path} fill="currentColor" />
  </svg>
)
