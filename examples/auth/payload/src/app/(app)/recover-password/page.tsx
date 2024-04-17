import React from 'react'

import { Gutter } from '../_components/Gutter'
import { RecoverPasswordForm } from './RecoverPasswordForm'
import classes from './index.module.scss'

export default function RecoverPassword() {
  return (
    <Gutter className={classes.recoverPassword}>
      <RecoverPasswordForm />
    </Gutter>
  )
}
