import React from 'react'

export const SitemapIcon: React.FC<{ readonly size?: 16 | 24 }> = ({ size = 24 }) => (
  <svg
    aria-hidden="true"
    className="icon"
    fill="none"
    height={size}
    viewBox="0 0 24 24"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 5v13m0-9h6m-6 9h6M12 7h6v4h-6zM12 16h6v4h-6z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
