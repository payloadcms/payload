import type { WidgetServerProps } from 'payload'

import React from 'react'

import { getValueAtPath } from '../RecentlyViewed/getDocumentThumbnail.js'
import './index.css'

export function WelcomeWidget({ req: { i18n, payload, user } }: WidgetServerProps) {
  if (!user) {
    return null
  }
  const collection = payload.collections[user.collection]?.config
  const title = collection?.admin.useAsTitle
    ? getValueAtPath({ path: collection.admin.useAsTitle, value: user })
    : undefined
  const name =
    (typeof title === 'string' && title) || user.username || user.email || String(user.id)
  return (
    <h1 className="welcome-widget">
      {i18n.t('general:welcome')}, {name}
    </h1>
  )
}
