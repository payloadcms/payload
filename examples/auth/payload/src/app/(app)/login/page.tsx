import { redirect } from 'next/navigation'
import React from 'react'

import { Gutter } from '../_components/Gutter'
import { RenderParams } from '../_components/RenderParams'
import { auth } from '../auth'
import classes from './index.module.scss'
import { LoginForm } from './LoginForm'

// eslint-disable-next-line no-restricted-exports
export default async function Login() {
  const { user } = await auth()

  if (user) {
    redirect(`/account?message=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <Gutter className={classes.login}>
      <RenderParams className={classes.params} />
      <h1>Log in</h1>
      <LoginForm />
    </Gutter>
  )
}
