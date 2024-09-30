import type { AdminViewProps } from 'payload'

import { Button } from '@payloadcms/ui'
import { formatAdminURL, Translation } from '@payloadcms/ui/shared'
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
    admin: {
      routes: { account: accountRoute, login: loginRoute },
    },
    routes: { admin: adminRoute },
  } = config

  if (user) {
    return (
      <Fragment>
        <h1>{i18n.t('authentication:alreadyLoggedIn')}</h1>
        <p>
          <Translation
            elements={{
              '0': ({ children }) => (
                <Link
                  href={formatAdminURL({
                    adminRoute,
                    path: accountRoute,
                  })}
                >
                  {children}
                </Link>
              ),
            }}
            i18nKey="authentication:loggedInChangePassword"
            t={i18n.t}
          />
        </p>
        <br />
        <Button buttonStyle="secondary" el="link" Link={Link} size="large" to={adminRoute}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <ForgotPasswordForm />
      <Link
        href={formatAdminURL({
          adminRoute,
          path: loginRoute,
        })}
      >
        {i18n.t('authentication:backToLogin')}
      </Link>
    </Fragment>
  )
}
