import React from 'react'

import { Gutter } from '../../_components/Gutter'
import { RecoverPasswordForm } from './RecoverPasswordForm'

import classes from './index.module.scss'

const RecoverPassword: React.FC = () => {
  return (
    <Gutter className={classes.recoverPassword}>
      <RecoverPasswordForm />
    </Gutter>
  )
}

export default RecoverPassword
