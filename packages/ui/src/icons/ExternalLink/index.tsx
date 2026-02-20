import React from 'react'

import './index.scss'

export const ExternalLinkIcon: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  return (
    <svg
      className={[className, 'icon icon--externalLink'].filter(Boolean).join(' ')}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="stroke"
        d="M16 10.6667V14.6667C16 15.0203 15.8595 15.3594 15.6095 15.6095C15.3594 15.8595 15.0203 16 14.6667 16H5.33333C4.97971 16 4.64057 15.8595 4.39052 15.6095C4.14048 15.3594 4 15.0203 4 14.6667V5.33333C4 4.97971 4.14048 4.64057 4.39052 4.39052C4.64057 4.14048 4.97971 4 5.33333 4H9.33333M16 4L10 10M16 4H12M16 4V8"
        strokeLinecap="square"
      />
    </svg>
  )
}
