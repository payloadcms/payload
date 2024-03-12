import type { AdminViewProps } from 'payload/types'

import LinkImport from 'next/link.js'
import { Button } from 'packages/ui/src/index.js'
import React, { Fragment } from 'react'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export { generateUnauthorizedMetadata } from './meta.js'

export const Unauthorized: React.FC<AdminViewProps> = ({ initPageResult }) => {
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
    <Fragment>
      <h2>{i18n.t('error:unauthorized')}</h2>
      <p>{i18n.t('error:notAllowedToAccessPage')}</p>
      <br />
      <Button Link={Link} el="link" to={logoutRoute}>
        {i18n.t('authentication:logOut')}
      </Button>
    </Fragment>
  )
}
