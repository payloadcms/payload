import React from 'react'
import Link from 'next/link'

import { Gutter } from '../../_components/Gutter'
import { RenderParams } from '../../_components/RenderParams'
import { getMeUser } from '../../_utilities/getMeUser'
import LoginForm from './Form'

import classes from './index.module.scss'

const Login = async () => {
  await getMeUser({
    validUserRedirect: `/account?message=${encodeURIComponent('You are already logged in.')}`,
  })

  return (
    <Gutter className={classes.login}>
      <RenderParams className={classes.params} />
      <h1>Log in</h1>
      <LoginForm />
      <Link href="/create-account">Create an account</Link>
      <br />
      <Link href="/recover-password">Recover your password</Link>
    </Gutter>
  )
}

export default Login
