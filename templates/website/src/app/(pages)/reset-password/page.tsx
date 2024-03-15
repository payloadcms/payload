import type { Metadata } from 'next'

import React from 'react'

import { Gutter } from '../../_components/Gutter'
import { mergeOpenGraph } from '../../_utilities/mergeOpenGraph'
import { ResetPasswordForm } from './ResetPasswordForm'
import classes from './index.module.scss'

export default async function ResetPassword() {
  return (
    <Gutter className={classes.resetPassword}>
      <h1>Reset Password</h1>
      <p>Please enter a new password below.</p>
      <ResetPasswordForm />
    </Gutter>
  )
}

export const metadata: Metadata = {
  description: 'Enter a new password.',
  openGraph: mergeOpenGraph({
    title: 'Reset Password',
    url: '/reset-password',
  }),
  title: 'Reset Password',
}
