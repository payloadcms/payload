import type { AdminViewComponent, PayloadServerReactComponent } from 'payload'

import { Button, Gutter } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

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
        },
      },
    },
  } = initPageResult

  return (
    <Gutter className={baseClass}>
      <h2>{i18n.t('error:unauthorized')}</h2>
      <p>{i18n.t('error:notAllowedToAccessPage')}</p>
      <Button
        className={`${baseClass}__button`}
        el="link"
        Link={Link}
        size="large"
        to={logoutRoute}
      >
        {i18n.t('authentication:logOut')}
      </Button>
    </Gutter>
  )
}
