import type { AdminViewServerProps } from 'payload'

import React from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds
import { Gutter } from '../../exports/client/index.js'
import './index.css'

const baseClass = 'unauthorized'

export function UnauthorizedView({ initPageResult }: AdminViewServerProps) {
  const {
    req: { i18n },
  } = initPageResult

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__content`}>
        <h1>{i18n.t('general:unauthorized')}</h1>
        <p>{i18n.t('error:notAllowedToAccessPage')}</p>
      </div>
    </div>
  )
}

export const UnauthorizedViewWithGutter = (props: AdminViewServerProps) => {
  return (
    <Gutter className={`${baseClass}--with-gutter`}>
      <UnauthorizedView {...props} />
    </Gutter>
  )
}
