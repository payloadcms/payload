import React from 'react'

export const ExternalLinkIcon: React.FC<{
  className?: string
}> = (props) => {
  const { className } = props
  return (
    <svg
      className={className}
      clipRule="evenodd"
      fillRule="evenodd"
      height="100%"
      viewBox="0 0 24 24"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 4h-13v18h20v-11h1v12h-22v-20h14v1zm10 5h-1v-6.293l-11.646 11.647-.708-.708 11.647-11.646h-6.293v-1h8v8z"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  )
}
