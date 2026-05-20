import type { AdminViewServerProps } from 'payload'

import { Gutter } from '@payloadcms/ui'
import React from 'react'

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
