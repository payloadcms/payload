import React from 'react'

import './index.css'

export const RefreshIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--refresh', className].filter(Boolean).join(' ')}
    fill="none"
    height={16}
    viewBox="0 0 16 16"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="stroke"
      d="M12.5 3v2.5H10m-4 5H3.5V13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      className="fill"
      clipRule="evenodd"
      d="M8 3.5a4.5 4.5 0 0 0-4.473 4c-.03.275-.25.5-.527.5a.467.467 0 0 1-.478-.5 5.5 5.5 0 0 1 9.758-2.954.467.467 0 0 1-.12.68c-.23.154-.538.09-.715-.122A4.49 4.49 0 0 0 8 3.5m-4.16 7.274a.467.467 0 0 0-.12.68A5.5 5.5 0 0 0 13.478 8.5.467.467 0 0 0 13 8c-.276 0-.497.225-.527.5a4.5 4.5 0 0 1-7.918 2.396c-.177-.212-.486-.276-.715-.123"
      fillRule="evenodd"
    />
  </svg>
)
