import React from 'react'

export const UploadIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={['icon', 'icon--upload', className].filter(Boolean).join(' ')}
    fill="none"
    focusable="false"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M12.354 6.146a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L11.5 7.707V13.5a.5.5 0 0 0 1 0V7.707l2.146 2.147a.5.5 0 0 0 .708-.708zM7 13.5a.5.5 0 0 0-1 0v3A1.5 1.5 0 0 0 7.5 18h9a1.5 1.5 0 0 0 1.5-1.5v-3a.5.5 0 0 0-1 0v3a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
