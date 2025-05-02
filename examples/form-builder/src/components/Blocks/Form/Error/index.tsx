import * as React from 'react'

import classes from './index.module.scss'

export const Error: React.FC = () => {
  return <div className={classes.error}>This field is required</div>
}
