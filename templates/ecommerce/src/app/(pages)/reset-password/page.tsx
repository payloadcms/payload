import React from 'react'

import { Gutter } from '../../_components/Gutter'
import { ResetPasswordForm } from './Form'

import classes from './index.module.scss'

const ResetPassword: React.FC = () => {
  return (
    <Gutter className={classes.resetPassword}>
      <h1>Reset Password</h1>
      <p>Please enter a new password below.</p>
      <ResetPasswordForm />
    </Gutter>
  )
}

export default ResetPassword
