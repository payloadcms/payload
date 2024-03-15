import React from 'react'

import classes from './index.module.scss'

export const LoadingShimmer: React.FC<{
  height?: number // in `base` units
  number?: number
}> = (props) => {
  const arrayFromNumber = Array.from(Array(props.number || 1).keys())

  return (
    <div className={classes.loading}>
      {arrayFromNumber.map((_, index) => (
        <div className={classes.shimmer} key={index} />
      ))}
    </div>
  )
}
