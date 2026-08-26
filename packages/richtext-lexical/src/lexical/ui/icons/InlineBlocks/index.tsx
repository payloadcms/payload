'use client'
import React from 'react'

const path =
  'M17 8C18.1046 8 19 8.89543 19 10V14L18.9893 14.2041C18.8938 15.1457 18.1457 15.8938 17.2041 15.9893L17 16H7L6.7959 15.9893C5.78722 15.887 5 15.0357 5 14V10C5 8.89543 5.89543 8 7 8H17ZM7 9C6.44772 9 6 9.44772 6 10V14C6 14.5523 6.44772 15 7 15H17C17.5523 15 18 14.5523 18 14V10C18 9.44772 17.5523 9 17 9H7ZM9 11C9.55228 11 10 11.4477 10 12C10 12.5523 9.55228 13 9 13C8.44772 13 8 12.5523 8 12C8 11.4477 8.44772 11 9 11ZM12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11ZM15 11C15.5523 11 16 11.4477 16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11Z'

export const InlineBlocksIcon: React.FC<{
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
