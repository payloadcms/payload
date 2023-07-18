import React from 'react'
import { Metadata } from 'next'

import { fetchGlobals } from '../../_api/fetchGlobals'
import { Gutter } from '../../_components/Gutter'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'
import { LogoutPage } from './LogoutPage'

import classes from './index.module.scss'

export default async function Logout() {
  const { settings } = await fetchGlobals()

  return (
    <Gutter className={classes.logout}>
      <LogoutPage settings={settings} />
    </Gutter>
  )
}

export const metadata: Metadata = {
  title: 'Logout',
  description: 'You have been logged out.',
  openGraph: mergeOpenGraph({
    title: 'Logout',
    url: '/logout',
  }),
}
