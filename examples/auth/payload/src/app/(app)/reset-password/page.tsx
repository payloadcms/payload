/* eslint-disable no-restricted-exports */
import { redirect } from 'next/navigation'
import React from 'react'

import { Gutter } from '../_components/Gutter'
import { auth } from '../auth'
import classes from './index.module.scss'
import { ResetPasswordForm } from './ResetPasswordForm'

export default async function ResetPassword() {
  const { user } = await auth()

  if (user) {
    redirect(`/account?message=${encodeURIComponent('Cannot reset password while logged in.')}`)
  }

  return (
    <Gutter className={classes.resetPassword}>
      <h1>Reset Password</h1>
      <p>Please enter a new password below.</p>
      <ResetPasswordForm />
    </Gutter>
  )
}
