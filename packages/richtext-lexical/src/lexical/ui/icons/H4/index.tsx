'use client'
import React from 'react'

const path =
  'M3.639 13.5V7.074H5.196V9.648H8.076V7.074H9.642V13.5H8.076V10.836H5.196V13.5H3.639ZM15.1736 7.074V10.854H16.3706V12.033H15.1736V13.5H13.6796V12.033H10.5116V10.845L13.4996 7.074H15.1736ZM13.6796 8.46L11.8256 10.854H13.6796V8.46Z'

export const H4Icon: React.FC<{
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
