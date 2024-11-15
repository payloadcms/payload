import type { AdminViewComponent, PayloadServerReactComponent } from 'payload'

import { Button, LinkTransition } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import React from 'react'

import { FormHeader } from '../../elements/FormHeader/index.js'
import './index.scss'

export { generateUnauthorizedMetadata } from './meta.js'

const baseClass = 'unauthorized'

export const UnauthorizedView: PayloadServerReactComponent<AdminViewComponent> = ({
  initPageResult,
}) => {
  const {
    req: {
      i18n,
      payload: {
        config: {
          admin: {
            routes: { logout: logoutRoute },
          },
          routes: { admin: adminRoute },
        },
      },
    },
  } = initPageResult

  return (
    <div className={baseClass}>
      <FormHeader
        description={i18n.t('error:notAllowedToAccessPage')}
        heading={i18n.t('error:unauthorized')}
      />

      <Button
        className={`${baseClass}__button`}
        el="link"
        Link={LinkTransition}
        size="large"
        to={formatAdminURL({
          adminRoute,
          path: logoutRoute,
        })}
      >
        {i18n.t('authentication:logOut')}
      </Button>
    </div>
  )
}
