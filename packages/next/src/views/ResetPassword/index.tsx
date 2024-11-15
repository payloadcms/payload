import type { AdminViewProps } from 'payload'

import { Button, LinkTransition } from '@payloadcms/ui'
import { formatAdminURL, Translation } from '@payloadcms/ui/shared'
import React from 'react'

import { FormHeader } from '../../elements/FormHeader/index.js'
import './index.scss'
import { ResetPasswordForm } from './ResetPasswordForm/index.js'

export const resetPasswordBaseClass = 'reset-password'

export { generateResetPasswordMetadata } from './meta.js'

export const ResetPassword: React.FC<AdminViewProps> = ({ initPageResult, params }) => {
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
                  <LinkTransition
                    href={formatAdminURL({
                      adminRoute,
                      path: accountRoute,
                    })}
                    prefetch={false}
                  >
                    {children}
                  </LinkTransition>
                ),
              }}
              i18nKey="authentication:loggedInChangePassword"
              t={i18n.t}
            />
          }
          heading={i18n.t('authentication:alreadyLoggedIn')}
        />
        <Button
          buttonStyle="secondary"
          el="link"
          Link={LinkTransition}
          size="large"
          to={adminRoute}
        >
          {i18n.t('general:backToDashboard')}
        </Button>
      </div>
    )
  }

  return (
    <div className={`${resetPasswordBaseClass}__wrap`}>
      <FormHeader heading={i18n.t('authentication:resetPassword')} />
      <ResetPasswordForm token={token} />
      <LinkTransition
        href={formatAdminURL({
          adminRoute,
          path: loginRoute,
        })}
        prefetch={false}
      >
        {i18n.t('authentication:backToLogin')}
      </LinkTransition>
    </div>
  )
}
