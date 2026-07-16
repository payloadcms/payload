import React from 'react'

import './index.css'

const paths = {
  // icon-16-edit-object from Figma
  16: 'M9.86914 2.72438C10.2619 2.40402 10.8409 2.42662 11.207 2.79273L13.207 4.79273C13.5974 5.18327 13.5975 5.81631 13.207 6.2068L6.70703 12.7068C6.51951 12.8943 6.26516 12.9998 6 12.9998H4C3.44779 12.9998 3.00013 12.5519 3 11.9998V9.99977C3 9.7346 3.10551 9.48026 3.29297 9.29273L9.79297 2.79273L9.86914 2.72438ZM4 9.99977V11.9998H6L10.6465 7.35328L8.64648 5.35328L4 9.99977ZM9.35352 4.64625L11.3535 6.64625L12.5 5.49977L10.5 3.49977L9.35352 4.64625Z',
  // 1.5x scale of icon-16-edit-object from Figma. There is no 24px Figma variant for this icon.
  24: 'M14.80371 4.08657C15.39285 3.60603 16.26135 3.63993 16.8105 4.1891L19.8105 7.1891C20.3961 7.77491 20.39625 8.72446 19.8105 9.3102L10.06054 19.0602C9.77927 19.34145 9.39774 19.4997 9 19.4997H6C5.17169 19.4997 4.50019 18.82785 4.5 17.9997V14.99966C4.5 14.6019 4.65827 14.22039 4.93945 13.9391L14.68946 4.1891L14.80371 4.08657ZM6 14.99966V17.9997H9L15.96975 11.02992L12.96972 8.02992L6 14.99966ZM14.03028 6.96938L17.03025 9.96937L18.75 8.24966L15.75 5.24965L14.03028 6.96938Z',
} as const

export const EditIcon: React.FC<{
  readonly className?: string
  readonly size?: keyof typeof paths
}> = ({ className, size = 16 }) => (
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
