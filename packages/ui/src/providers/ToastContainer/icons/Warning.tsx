'use client'
import React from 'react'

export const Warning: React.FC = () => {
  return (
    <svg fill="none" height="26" viewBox="0 0 26 26" width="26" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 21C17.4183 21 21 17.4183 21 13C21 8.58172 17.4183 5 13 5C8.58172 5 5 8.58172 5 13C5 17.4183 8.58172 21 13 21Z"
        fill="var(--theme-warning-500)"
      />
      <path
        d="M13 10V13.2M13 16.4H13.008"
        stroke="var(--theme-warning-50)"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
