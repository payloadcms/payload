'use client'

import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import './index.css'

const baseClass = 'unauthorized'

/**
 * Client-only twin of {@link import('./index.js').UnauthorizedView}.
 *
 * The server `UnauthorizedView` reads i18n from `initPageResult.req.i18n`,
 * which non-RSC adapters (e.g. TanStack Start) can't pass across a JSON
 * boundary. This variant resolves i18n via the React context the
 * `RootProvider` already sets up on the client.
 */
export function UnauthorizedView() {
  const { t } = useTranslation()

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__content`}>
        <h1>{t('general:unauthorized')}</h1>
        <p>{t('error:notAllowedToAccessPage')}</p>
      </div>
    </div>
  )
}
