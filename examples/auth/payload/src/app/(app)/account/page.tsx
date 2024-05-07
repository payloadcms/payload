import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { Button } from '../_components/Button'
import { Gutter } from '../_components/Gutter'
import { RenderParams } from '../_components/RenderParams'
import { getUser } from '../_utilities/getUser'
import { AccountForm } from './AccountForm'
import classes from './index.module.scss'

export default async function Account() {
  const headers = getHeaders()
  const user = await getUser(headers)

  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent('You must be logged in to access your account.')}&redirect=/account`,
    )
  }

  return (
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
      <AccountForm user={user} />
      <Button appearance="secondary" href="/logout" label="Log out" />
    </Gutter>
  )
}
