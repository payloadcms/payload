import React from 'react'

const paths: Record<16 | 24, string> = {
  16: 'M6.146 9.146a.5.5 0 1 1 .708.708L4.707 12H6.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 1 0v1.793zM12.5 3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V4.707L9.854 6.854a.5.5 0 1 1-.708-.708L11.293 4H9.5a.5.5 0 0 1 0-1z',
  24: 'm17 7.707-3.146 3.147a.5.5 0 0 1-.708-.708L16.293 7H13.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0zm-6.854 5.44a.5.5 0 0 1 .708.707L7.707 17H10.5a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 1 0v2.793z',
}

export const ExpandIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--expand', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="fill" d={paths[size]} />
  </svg>
)
