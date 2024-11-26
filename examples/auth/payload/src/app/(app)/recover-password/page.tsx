/* eslint-disable no-restricted-exports */
import { redirect } from 'next/navigation'
import React from 'react'

import { Gutter } from '../_components/Gutter'
import { auth } from '../auth'
import classes from './index.module.scss'
import { RecoverPasswordForm } from './RecoverPasswordForm'

export default async function RecoverPassword() {
  const { user } = await auth()

  if (user) {
    redirect(`/account?message=${encodeURIComponent('Cannot recover password while logged in.')}`)
  }

  return (
    <Gutter className={classes.recoverPassword}>
      <RecoverPasswordForm />
    </Gutter>
  )
}
