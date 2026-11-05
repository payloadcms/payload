'use client'
import React from 'react'

const path =
  'M12.5 5C12.6326 5 12.7597 5.05272 12.8535 5.14648L16.8535 9.14648C16.9965 9.28948 17.0393 9.50457 16.9619 9.69141C16.8845 9.87821 16.7022 10 16.5 10H12.5C12.2239 10 12 9.77614 12 9.5V6H8.5C8.22386 6 8 6.22386 8 6.5V17.5C8 17.7761 8.22386 18 8.5 18H15.5C15.7761 18 16 17.7761 16 17.5V11.5C16 11.2239 16.2239 11 16.5 11C16.7761 11 17 11.2239 17 11.5V17.5C17 18.3284 16.3284 19 15.5 19H8.5C7.67157 19 7 18.3284 7 17.5V6.5C7 5.67157 7.67157 5 8.5 5H12.5ZM13 9H15.293L13 6.70703V9Z'

export const PageIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={['icon', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={path} fill="currentColor" />
  </svg>
)
