import type { AdminViewProps } from 'payload'

import { Button } from '@payloadcms/ui'
import { formatAdminURL, Translation } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React from 'react'

import { FormHeader } from '../../elements/FormHeader/index.js'
import './index.scss'
import { ResetPasswordForm } from './ResetPasswordForm/index.js'

export const resetPasswordBaseClass = 'reset-password'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

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
          }
          heading={i18n.t('authentication:alreadyLoggedIn')}
        />
        <Button buttonStyle="secondary" el="link" Link={Link} size="large" to={adminRoute}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </div>
    )
  }

  return (
    <div className={`${resetPasswordBaseClass}__wrap`}>
      <FormHeader heading={i18n.t('authentication:resetPassword')} />
      <ResetPasswordForm token={token} />
      <Link
        href={formatAdminURL({
          adminRoute,
          path: loginRoute,
        })}
      >
        {i18n.t('authentication:backToLogin')}
      </Link>
    </div>
  )
}
