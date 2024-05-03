import { initPage } from '@payloadcms/next/utilities'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '../../../payload.config'
import { Gutter } from '../_components/Gutter'
import { RenderParams } from '../_components/RenderParams'
import { LoginForm } from './LoginForm'
import classes from './index.module.scss'

export default async function Login({
  searchParams,
}: {
  searchParams: {
    [key: string]: string | string[]
  }
}) {
  const {
    req: { user },
  } = await initPage({
    config: configPromise,
    route: '/login',
    searchParams,
  })

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
