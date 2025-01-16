import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '../../../payload.config'
import { Gutter } from '../_components/Gutter'
import classes from './index.module.scss'
import { LogoutPage } from './LogoutPage'

export default async function Logout() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return (
      <Gutter className={classes.logout}>
        <h1>You are already logged out.</h1>
        <p>
          {'What would you like to do next? '}
          <Link href="/">Click here</Link>
          {` to go to the home page. To log back in, `}
          <Link href="/login">click here</Link>.
        </p>
      </Gutter>
    )
  }

  return (
    <Gutter className={classes.logout}>
      <LogoutPage />
    </Gutter>
  )
}
