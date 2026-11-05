import React from 'react'

export const ClockIcon: React.FC<{
  readonly className?: string
  readonly size?: 16 | 24
}> = ({ className, size = 16 }) => (
  <svg
    className={['icon', 'icon--clock', className].filter(Boolean).join(' ')}
    fill="none"
    height={size}
    viewBox="0 0 14 14"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.13401 14 0 10.866 0 7C0 3.13401 3.13401 0 7 0ZM7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1ZM7 3C7.27614 3 7.5 3.22386 7.5 3.5V6.79297L9.35352 8.64648C9.54878 8.84175 9.54878 9.15825 9.35352 9.35352C9.15825 9.54878 8.84175 9.54878 8.64648 9.35352L6.64648 7.35352C6.55272 7.25975 6.5 7.13261 6.5 7V3.5C6.5 3.22386 6.72386 3 7 3Z"
      fill="currentColor"
    />
  </svg>
)
