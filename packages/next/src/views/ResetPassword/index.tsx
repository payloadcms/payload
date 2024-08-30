import type { AdminViewProps } from 'payload'

import { Button } from '@payloadcms/ui'
import { formatAdminURL, Translation } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React from 'react'

import { ResetPasswordClient } from './index.client.js'
import './index.scss'

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
      routes: { account: accountRoute },
    },
    routes: { admin: adminRoute },
  } = config

  if (user) {
    return (
      <div className={`${resetPasswordBaseClass}__wrap`}>
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
        <Button buttonStyle="secondary" el="link" Link={Link} size="large" to={adminRoute}>
          {i18n.t('general:backToDashboard')}
        </Button>
      </div>
    )
  }

  return (
    <div className={`${resetPasswordBaseClass}__wrap`}>
      <h1>{i18n.t('authentication:resetPassword')}</h1>
      <ResetPasswordClient token={token} />
    </div>
  )
}
