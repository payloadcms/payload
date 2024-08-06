import React from 'react'

export type ChevronProps = {
  className?: string
  rotate?: number
}

export const Chevron = ({ className, rotate }: ChevronProps) => {
  return (
    <svg
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      style={{
        transform: typeof rotate === 'number' ? `rotate(${rotate || 0}deg)` : undefined,
      }}
    >
      <path
        d="M23.245 4l-11.245 14.374-11.219-14.374-.781.619 12 15.381 12-15.391-.755-.609z"
        stroke="currentColor"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
