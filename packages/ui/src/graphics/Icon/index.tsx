import React from 'react'

export const PayloadIcon: React.FC<{
  fill?: string
}> = ({ fill: fillFromProps }) => {
  const fill = fillFromProps || 'var(--theme-elevation-1000)'

  return (
    <svg
      className="graphic-icon"
      height="100%"
      viewBox="0 0 25 25"
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5293 0L23 6.90096V19.9978L14.3608 25V11.9032L2.88452 5.00777L11.5293 0Z"
        fill={fill}
      />
      <path d="M10.6559 24.2727V14.0518L2 19.0651L10.6559 24.2727Z" fill={fill} />
    </svg>
  )
}
