import { ResetPasswordForm, useTranslation } from '@payloadcms/ui'
import { FormHeader } from '@payloadcms/ui/elements/FormHeader'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function ResetPasswordView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()

  return (
    <div className="reset-password__wrap">
      <FormHeader heading={t('authentication:resetPassword')} />
      <ResetPasswordForm token={String(pageState.routeParams.token || '')} />
    </div>
  )
}
