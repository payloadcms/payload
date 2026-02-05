'use client'

import React from 'react'

type TreeConnectorProps = {
  className?: string
}

export const TreeConnector: React.FC<TreeConnectorProps> = ({ className }) => {
  return (
    <svg
      className={className}
      fill="none"
      height="9"
      viewBox="0 0 9 9"
      width="9"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.59062 7.83333H3.16667C2.45942 7.83333 1.78115 7.55238 1.28105 7.05229C0.780951 6.55219 0.5 5.87391 0.5 5.16667V0.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
