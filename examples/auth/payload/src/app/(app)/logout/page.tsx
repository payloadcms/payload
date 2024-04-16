import React from 'react'

import { Gutter } from '../_components/Gutter'
import { LogoutPage } from './LogoutPage'
import classes from './index.module.scss'

export default function Logout() {
  return (
    <Gutter className={classes.logout}>
      <LogoutPage />
    </Gutter>
  )
}
