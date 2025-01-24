import React, { Fragment } from 'react'

import { Gutter } from '@/components/Gutter'
import classes from './index.module.scss'

export default async function HomePage() {
  return (
    <Fragment>
      <Gutter className={classes.home}>
        <h1>Payload Blank Template</h1>
      </Gutter>
    </Fragment>
  )
}
