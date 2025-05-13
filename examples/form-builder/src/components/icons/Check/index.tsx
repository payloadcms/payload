import React from 'react'

import classes from './index.module.scss'

export const Check: React.FC = () => {
  return (
    <svg className={classes.checkBox} height="100%" viewBox="0 0 25 25" width="100%">
      <path
        className={classes.stroke}
        d="M10.6092 16.0192L17.6477 8.98076"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
      <path
        className={classes.stroke}
        d="M7.35229 12.7623L10.6092 16.0192"
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}
