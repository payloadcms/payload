import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

import { Gutter } from '../_components/Gutter'
import { getUser } from '../_utilities/getUser'
import { RecoverPasswordForm } from './RecoverPasswordForm'
import classes from './index.module.scss'

export default async function RecoverPassword() {
  const headers = getHeaders()
  const user = await getUser(headers)

  if (user) {
    redirect(`/account?message=${encodeURIComponent('Cannot recover password while logged in.')}`)
  }

  return (
    <Gutter className={classes.recoverPassword}>
      <RecoverPasswordForm />
    </Gutter>
  )
}
