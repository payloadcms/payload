import { Button, Gutter, useTranslation } from '@payloadcms/ui'
import { FormHeader } from '@payloadcms/ui/elements/FormHeader'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { SerializablePageState } from '../Root/types.js'

export function UnauthorizedView({ pageState }: { pageState: SerializablePageState }) {
  const { t } = useTranslation()

  return (
    <Gutter className="unauthorized unauthorized--with-gutter">
      <FormHeader
        description={t('error:notAllowedToAccessPage')}
        heading={t('error:unauthorized')}
      />
      <Button
        className="unauthorized__button"
        el="link"
        size="large"
        to={formatAdminURL({
          adminRoute: pageState.clientConfig.routes.admin,
          path: pageState.clientConfig.admin.routes.logout,
        })}
      >
        {t('authentication:logOut')}
      </Button>
    </Gutter>
  )
}
