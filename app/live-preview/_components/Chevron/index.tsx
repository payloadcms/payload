import React from 'react'

export const Chevron: React.FC<{
  className?: string
  rotate?: number
}> = ({ className, rotate }) => {
  return (
    <svg
      className={className}
      height="100%"
      style={{
        transform: typeof rotate === 'number' ? `rotate(${rotate || 0}deg)` : undefined,
      }}
      viewBox="0 0 24 24"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.245 4l-11.245 14.374-11.219-14.374-.781.619 12 15.381 12-15.391-.755-.609z"
        fill="none"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
