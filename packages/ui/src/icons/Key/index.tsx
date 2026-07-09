import React from 'react'

import './index.css'

const paths = {
  24: 'M10.7988 11.1154L11.1794 10.7348L11.0713 10.2075C11.0247 9.97983 11 9.74332 11 9.5C11 7.567 12.567 6 14.5 6C16.433 6 18 7.567 18 9.5C18 11.433 16.433 13 14.5 13C14.2313 13 13.9708 12.9699 13.7213 12.9133L12.5 12.6362V13.8885V14H11.5H10.5V15V16H9.5H8.5V17V18H6V15.9142L10.7988 11.1154ZM13.5 14C13.5 14.1878 13.4482 14.3636 13.3581 14.5137C13.1834 14.805 12.8644 15 12.5 15H11.5V16C11.5 16.5523 11.0523 17 10.5 17H9.5V18C9.5 18.5523 9.05228 19 8.5 19H6C5.44772 19 5 18.5523 5 18V15.9142C5 15.649 5.10536 15.3946 5.29289 15.2071L10.0917 10.4083C10.0316 10.1149 10 9.81115 10 9.5C10 7.01472 12.0147 5 14.5 5C16.9853 5 19 7.01472 19 9.5C19 11.9853 16.9853 14 14.5 14C14.1563 14 13.8216 13.9615 13.5 13.8885V14ZM15 10C15.5523 10 16 9.55228 16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9C14 9.55228 14.4477 10 15 10Z',
}

export const KeyIcon: React.FC<{
  readonly className?: string
  readonly size?: 24
}> = ({ className, size = 24 }) => (
  <svg
    className={['icon', 'icon--key', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path clipRule="evenodd" d={paths[size]} fill="currentColor" fillRule="evenodd" />
  </svg>
)
