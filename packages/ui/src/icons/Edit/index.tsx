import React from 'react'

import './index.css'

const paths = {
  16: 'M9.86914 2.72438C10.2619 2.40402 10.8409 2.42662 11.207 2.79273L13.207 4.79273C13.5974 5.18327 13.5975 5.81631 13.207 6.2068L6.70703 12.7068C6.51951 12.8943 6.26516 12.9998 6 12.9998H4C3.44779 12.9998 3.00013 12.5519 3 11.9998V9.99977C3 9.7346 3.10551 9.48026 3.29297 9.29273L9.79297 2.79273L9.86914 2.72438ZM4 9.99977V11.9998H6L10.6465 7.35328L8.64648 5.35328L4 9.99977ZM9.35352 4.64625L11.3535 6.64625L12.5 5.49977L10.5 3.49977L9.35352 4.64625Z',
}
const size = 16

export const EditIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--edit', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
