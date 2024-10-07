import type { AdminViewComponent, PayloadServerReactComponent } from 'payload'

import { Button } from '@payloadcms/ui'
import { formatAdminURL } from '@payloadcms/ui/shared'
import LinkImport from 'next/link.js'
import React from 'react'

import { FormHeader } from '../../elements/FormHeader/index.js'
import './index.scss'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

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
        Link={Link}
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
