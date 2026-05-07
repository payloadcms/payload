'use client'
import React from 'react'

const path =
  'M9.5 6C9.77614 6 10 6.22386 10 6.5C10 6.77614 9.77614 7 9.5 7H7.5C7.22386 7 7 7.22386 7 7.5V16.5C7 16.7761 7.22386 17 7.5 17H16.5C16.7761 17 17 16.7761 17 16.5V14.5C17 14.2239 17.2239 14 17.5 14C17.7761 14 18 14.2239 18 14.5V16.5C18 17.3284 17.3284 18 16.5 18H7.5C6.67157 18 6 17.3284 6 16.5V7.5C6 6.67157 6.67157 6 7.5 6H9.5ZM17.5 6C17.7761 6 18 6.22386 18 6.5V11.5C18 11.7761 17.7761 12 17.5 12C17.2239 12 17 11.7761 17 11.5V7.70703L12.8535 11.8535C12.6583 12.0488 12.3417 12.0488 12.1465 11.8535C11.9512 11.6583 11.9512 11.3417 12.1465 11.1465L16.293 7H12.5C12.2239 7 12 6.77614 12 6.5C12 6.22386 12.2239 6 12.5 6H17.5Z'

export const RelationshipIcon: React.FC<{
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
