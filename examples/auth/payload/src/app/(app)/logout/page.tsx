import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import React from 'react'

import { Gutter } from '../_components/Gutter'
import { getUser } from '../_utilities/getUser'
import { LogoutPage } from './LogoutPage'
import classes from './index.module.scss'

export default async function Logout() {
  const headers = getHeaders()
  const user = await getUser(headers)

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
