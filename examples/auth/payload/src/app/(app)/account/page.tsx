import { initPage } from '@payloadcms/next/utilities'
import Link from 'next/link'
import React, { Fragment } from 'react'

import configPromise from '../../../payload.config'
import { Button } from '../_components/Button'
import { Gutter } from '../_components/Gutter'
import { HydrateClientUser } from '../_components/HydrateClientUser'
import { RenderParams } from '../_components/RenderParams'
import { AccountForm } from './AccountForm'
import classes from './index.module.scss'

export default async function Account({
  searchParams,
}: {
  searchParams: {
    [key: string]: string | string[]
  }
}) {
  const {
    permissions,
    req: { user },
  } = await initPage({
    config: configPromise,
    redirectUnauthenticatedUser: `/login?error=${encodeURIComponent('You must be logged in to access your account.')}`,
    route: '/account',
    searchParams,
  })

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
