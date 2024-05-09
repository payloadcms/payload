import type { AdminViewProps } from 'payload/types'

import { Button } from '@payloadcms/ui/elements/Button'
import { Translation } from '@payloadcms/ui/elements/Translation'
import LinkImport from 'next/link.js'
import React, { Fragment } from 'react'

import { ForgotPasswordForm } from './ForgotPasswordForm/index.js'

export { generateForgotPasswordMetadata } from './meta.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default
export const forgotPasswordBaseClass = 'forgot-password'

export const ForgotPasswordView: React.FC<AdminViewProps> = ({ initPageResult }) => {
  const {
    req: {
      i18n,
      payload: { config },
      user,
    },
  } = initPageResult

  const {
    routes: { admin },
  } = config

  if (user) {
    return (
      <Fragment>
        <h1>{i18n.t('authentication:alreadyLoggedIn')}</h1>
        <p>
          <Translation
            elements={{
              '0': ({ children }) => <Link href={`${admin}/account`}>{children}</Link>,
            }}
            i18nKey="authentication:loggedInChangePassword"
            t={i18n.t}
          />
        </p>
        <br />
        <Button Link={Link} buttonStyle="secondary" el="link" to={admin}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <ForgotPasswordForm />
      <Link href={`${admin}/login`}>{i18n.t('authentication:backToLogin')}</Link>
    </Fragment>
  )
}
