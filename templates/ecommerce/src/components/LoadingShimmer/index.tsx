import React from 'react'

export const LoadingShimmer: React.FC<{
  height?: number // in `base` units
  number?: number
}> = (props) => {
  const arrayFromNumber = Array.from(Array(props.number || 1).keys())

  return (
    <div className="">
      {arrayFromNumber.map((_, index) => (
        <div className="mb-3 h-4 w-5/6 animate-pulse rounded" key={index} />
      ))}
    </div>
  )
}
