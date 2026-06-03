import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import { Button } from '../../elements/Button/index.js'
import { FormHeader } from '../../elements/FormHeader/index.js'
import { Link } from '../../elements/Link/index.js'
import { Translation } from '../../elements/Translation/index.js'
import { ForgotPasswordForm } from './ForgotPasswordForm/index.js'
import './index.css'

export const forgotPasswordBaseClass = 'forgot-password'

export function ForgotPasswordView({ initPageResult }: AdminViewServerProps) {
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
        <FormHeader
          description={
            <Translation
              elements={{
                '0': ({ children }) => (
                  <Link
                    href={formatAdminURL({
                      adminRoute,
                      path: accountRoute,
                    })}
                    prefetch={false}
                  >
                    {children}
                  </Link>
                ),
              }}
              i18nKey="authentication:loggedInChangePassword"
              t={i18n.t}
            />
          }
          heading={i18n.t('authentication:alreadyLoggedIn')}
        />
        <Button buttonStyle="secondary" el="link" size="large" to={adminRoute}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <ForgotPasswordForm />
      <div className={`${forgotPasswordBaseClass}__back`}>
        <Link
          href={formatAdminURL({
            adminRoute,
            path: loginRoute,
          })}
          prefetch={false}
        >
          {i18n.t('authentication:backToLogin')}
        </Link>
      </div>
    </Fragment>
  )
}
