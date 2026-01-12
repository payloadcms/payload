import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '../../../payload.config'
import { Gutter } from '../_components/Gutter'
import classes from './index.module.scss'
import { RecoverPasswordForm } from './RecoverPasswordForm'

export default async function RecoverPassword() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?message=${encodeURIComponent('Cannot recover password while logged in.')}`)
  }

  return (
    <Gutter className={classes.recoverPassword}>
      <RecoverPasswordForm />
    </Gutter>
  )
}
