import type { AdminViewServerProps } from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { Button } from '../../elements/Button/index.js'
import { FormHeader } from '../../elements/FormHeader/index.js'
import { Link } from '../../elements/Link/index.js'
import { Translation } from '../../elements/Translation/index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { ResetPasswordForm } from '../../exports/client/index.js'
import './index.css'

export const resetPasswordBaseClass = 'reset-password'

export function ResetPassword({ initPageResult, params }: AdminViewServerProps) {
  const { req } = initPageResult

  const {
    segments: [_, token],
  } = params

  const {
    i18n,
    payload: { config },
    user,
  } = req

  const {
    admin: {
      routes: { account: accountRoute, login: loginRoute },
    },
    routes: { admin: adminRoute },
  } = config

  if (user) {
    return (
      <div className={`${resetPasswordBaseClass}__wrap`}>
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
        <Button
          buttonStyle="ghost"
          className={`${resetPasswordBaseClass}__back`}
          el="link"
          url={formatAdminURL({
            adminRoute,
            path: loginRoute,
          })}
        >
          {i18n.t('general:backToDashboard')}
        </Button>
      </div>
    )
  }

  return (
    <div className={`${resetPasswordBaseClass}__wrap`}>
      <ResetPasswordForm token={token} />
      <Button
        buttonStyle="ghost"
        className={`${resetPasswordBaseClass}__back`}
        el="link"
        url={formatAdminURL({
          adminRoute,
          path: loginRoute,
        })}
      >
        {i18n.t('authentication:backToLogin')}
      </Button>
    </div>
  )
}
