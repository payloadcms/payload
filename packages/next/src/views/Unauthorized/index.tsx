import type { AdminViewComponent } from 'payload/types'

import { Button } from '@payloadcms/ui/elements/Button'
import { Gutter } from '@payloadcms/ui/elements/Gutter'
import LinkImport from 'next/link.js'
import React from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export { generateUnauthorizedMetadata } from './meta.js'

export const Unauthorized: AdminViewComponent = ({ initPageResult }) => {
  const {
    req: {
      i18n,
      payload: {
        config: {
          admin: { logoutRoute },
        },
      },
    },
  } = initPageResult

  return (
    <Gutter className="unauthorized">
      <h2>{i18n.t('error:unauthorized')}</h2>
      <p>{i18n.t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button Link={Link} el="link" to={logoutRoute}>
        {i18n.t('authentication:logOut')}
      </Button>
    </Gutter>
  )
}
