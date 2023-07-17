import React from 'react'

import { fetchGlobals } from '../../_cms/fetchGlobals'
import { Gutter } from '../../_components/Gutter'
import { LogoutClient } from './Client'

import classes from './index.module.scss'

const Logout = async () => {
  const { settings } = await fetchGlobals()

  return (
    <Gutter className={classes.logout}>
      <LogoutClient settings={settings} />
    </Gutter>
  )
}

export default Logout
