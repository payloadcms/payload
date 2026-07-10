import React from 'react'

import './index.css'

export const SortDownIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--sort', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M7.5 6a.5.5 0 0 0-.5.5v9.793l-1.147-1.146-.078-.065a.5.5 0 0 0-.693.693l.064.079 2 2 .079.064a.5.5 0 0 0 .628-.064l2-2a.5.5 0 0 0-.707-.707L8 16.293V6.5a.5.5 0 0 0-.5-.5M18 16.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 1 0 0 1h5a.5.5 0 0 0 .5-.5m0-3a.5.5 0 0 0-.5-.5h-5a.5.5 0 1 0 0 1h5a.5.5 0 0 0 .5-.5m0-3a.5.5 0 0 0-.5-.5h-5a.5.5 0 1 0 0 1h5a.5.5 0 0 0 .5-.5m0-3a.5.5 0 0 0-.5-.5h-5a.5.5 0 1 0 0 1h5a.5.5 0 0 0 .5-.5"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

export const SortUpIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--sort', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M7.5 18a.5.5 0 0 1-.5-.5V7.707l-1.147 1.146-.078.065a.5.5 0 0 1-.693-.693l.064-.079 2-2 .079-.064a.5.5 0 0 1 .628.064l2 2a.5.5 0 0 1-.707.707L8 7.707V17.5a.5.5 0 0 1-.5.5M18 7.5a.5.5 0 0 1-.5.5h-5a.5.5 0 1 1 0-1h5a.5.5 0 0 1 .5.5m0 3a.5.5 0 0 1-.5.5h-5a.5.5 0 1 1 0-1h5a.5.5 0 0 1 .5.5m0 3a.5.5 0 0 1-.5.5h-5a.5.5 0 1 1 0-1h5a.5.5 0 0 1 .5.5m0 3a.5.5 0 0 1-.5.5h-5a.5.5 0 1 1 0-1h5a.5.5 0 0 1 .5.5"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
