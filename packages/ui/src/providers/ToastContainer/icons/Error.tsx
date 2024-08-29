'use client'
import React from 'react'

export const Error: React.FC = () => {
  return (
    <svg fill="none" height="26" viewBox="0 0 26 26" width="26" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 21C17.4183 21 21 17.4183 21 13C21 8.58172 17.4183 5 13 5C8.58172 5 5 8.58172 5 13C5 17.4183 8.58172 21 13 21Z"
        fill="var(--theme-error-500)"
      />
      <path
        d="M15.4001 10.5996L10.6001 15.3996M10.6001 10.5996L15.4001 15.3996"
        stroke="var(--theme-error-50)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
