import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React, { Fragment } from 'react'

import config from '../../../payload.config'
import { Button } from '../_components/Button'
import { Gutter } from '../_components/Gutter'
import { HydrateClientUser } from '../_components/HydrateClientUser'
import { RenderParams } from '../_components/RenderParams'
import { AccountForm } from './AccountForm'
import classes from './index.module.scss'

export default async function Account() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { permissions, user } = await payload.auth({ headers })

  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent('You must be logged in to access your account.')}&redirect=/account`,
    )
  }

  return (
    <Fragment>
      <HydrateClientUser permissions={permissions} user={user} />
      <Gutter className={classes.account}>
        <RenderParams className={classes.params} />
        <h1>Account</h1>
        <p>
          {`This is your account dashboard. Here you can update your account information and more. To manage all users, `}
          <Link href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/users`}>
            login to the admin dashboard
          </Link>
          .
        </p>
        <AccountForm />
        <Button appearance="secondary" href="/logout" label="Log out" />
      </Gutter>
    </Fragment>
  )
}
