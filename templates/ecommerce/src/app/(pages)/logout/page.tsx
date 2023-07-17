import React from 'react'

import { fetchGlobals } from '../../_api/fetchGlobals'
import { Gutter } from '../../_components/Gutter'
import { LogoutPage } from './LogoutPage'

import classes from './index.module.scss'

const Logout = async () => {
  const { settings } = await fetchGlobals()

  return (
    <Gutter className={classes.logout}>
      <LogoutPage settings={settings} />
    </Gutter>
  )
}

export default Logout
