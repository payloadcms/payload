import { CreateFirstUserClient, LoadingOverlay, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function CreateFirstUserView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()
  const data = pageState.pageData?.createFirstUser

  if (!data) {
    return <LoadingOverlay />
  }

  return (
    <div className="create-first-user">
      <h1>{t('general:welcome')}</h1>
      <p>{t('authentication:beginCreateFirstUser')}</p>
      <CreateFirstUserClient
        docPermissions={data.docPermissions as never}
        docPreferences={data.docPreferences as never}
        initialState={data.initialState as never}
        loginWithUsername={data.loginWithUsername as never}
        userSlug={data.userSlug}
      />
    </div>
  )
}
