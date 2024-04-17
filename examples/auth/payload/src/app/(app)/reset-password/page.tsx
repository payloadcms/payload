import React from 'react'

import { Gutter } from '../_components/Gutter'
import { ResetPasswordForm } from './ResetPasswordForm'
import classes from './index.module.scss'

export default function ResetPassword() {
  return (
    <Gutter className={classes.resetPassword}>
      <h1>Reset Password</h1>
      <p>Please enter a new password below.</p>
      <ResetPasswordForm />
    </Gutter>
  )
}
