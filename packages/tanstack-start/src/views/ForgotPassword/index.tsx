import { ForgotPasswordForm, Link, useTranslation } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function ForgotPasswordView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()

  return (
    <>
      <ForgotPasswordForm />
      <Link
        href={formatAdminURL({
          adminRoute: pageState.clientConfig.routes.admin,
          path: pageState.clientConfig.admin.routes.login,
        })}
        prefetch={false}
      >
        {t('authentication:backToLogin')}
      </Link>
    </>
  )
}
