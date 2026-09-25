import React from 'react'

import './index.css'

const paths = {
  24: 'M14.5 5C14.7761 5 15 5.22386 15 5.5V6H16.5C17.3284 6 18 6.67157 18 7.5V16.5C18 17.3284 17.3284 18 16.5 18H7.5C6.67157 18 6 17.3284 6 16.5V7.5C6 6.67157 6.67157 6 7.5 6H9V5.5C9 5.22386 9.22386 5 9.5 5C9.77614 5 10 5.22386 10 5.5V6H14V5.5C14 5.22386 14.2239 5 14.5 5ZM7 16.5C7 16.7761 7.22386 17 7.5 17H16.5C16.7761 17 17 16.7761 17 16.5V10H7V16.5ZM7.5 7C7.22386 7 7 7.22386 7 7.5V9H17V7.5C17 7.22386 16.7761 7 16.5 7H15V7.5C15 7.77614 14.7761 8 14.5 8C14.2239 8 14 7.77614 14 7.5V7H10V7.5C10 7.77614 9.77614 8 9.5 8C9.22386 8 9 7.77614 9 7.5V7H7.5Z',
}

export const CalendarIcon: React.FC<{
  readonly className?: string
}> = ({ className }) => (
  <svg
    className={['icon', 'icon--calendar', className].filter(Boolean).join(' ')}
    fill="none"
    height={24}
    viewBox="0 0 24 24"
    width={24}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill"
      clipRule="evenodd"
      d={paths[24]}
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)
