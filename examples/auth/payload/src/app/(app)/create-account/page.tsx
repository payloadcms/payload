import React from 'react'

import { Gutter } from '../_components/Gutter'
import { RenderParams } from '../_components/RenderParams'
import { getMeUser } from '../_utilities/getMeUser'
import { CreateAccountForm } from './CreateAccountForm'
import classes from './index.module.scss'

export default async function CreateAccount() {
  await getMeUser({
    validUserRedirect: `/account?message=${encodeURIComponent(
      'Cannot create a new account while logged in, please log out and try again.',
    )}`,
  })

  return (
    <Gutter className={classes.createAccount}>
      <h1>Create Account</h1>
      <RenderParams />
      <CreateAccountForm />
    </Gutter>
  )
}
