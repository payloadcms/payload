'use client'
import React from 'react'

const path =
  'M9.64645 8.14645C9.84171 7.95118 10.1582 7.95118 10.3535 8.14645C10.5487 8.34171 10.5487 8.65822 10.3535 8.85348L7.20699 12L10.3535 15.1464C10.5487 15.3417 10.5487 15.6582 10.3535 15.8535C10.1582 16.0487 9.84171 16.0487 9.64645 15.8535L6.14645 12.3535C5.95118 12.1582 5.95118 11.8417 6.14645 11.6464L9.64645 8.14645ZM13.6464 8.14645C13.8417 7.95118 14.1582 7.95118 14.3535 8.14645L17.8535 11.6464C18.0487 11.8417 18.0487 12.1582 17.8535 12.3535L14.3535 15.8535C14.1582 16.0487 13.8417 16.0487 13.6464 15.8535C13.4512 15.6582 13.4512 15.3417 13.6464 15.1464L16.7929 12L13.6464 8.85348C13.4512 8.65822 13.4512 8.34171 13.6464 8.14645Z'

export const CodeIcon: React.FC<{
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
