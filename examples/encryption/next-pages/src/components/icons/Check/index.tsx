import React from 'react'
import classes from './index.module.scss'

export const Check: React.FC = () => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 25 25"
      className={classes.checkBox}
    >
      <path
        d="M10.6092 16.0192L17.6477 8.98076"
        strokeLinecap="square"
        strokeLinejoin="bevel"
        className={classes.stroke}
      />
      <path
        d="M7.35229 12.7623L10.6092 16.0192"
        className={classes.stroke}
        strokeLinecap="square"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}
