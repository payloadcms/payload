import type { WidgetServerProps } from 'payload'

import React from 'react'

import { getWelcomeDisplay } from './getWelcomeDisplay.js'
import './index.css'

export function WelcomeWidget({ req, user }: WidgetServerProps) {
  const userCollection = req.payload.config.collections.find(
    ({ slug }) => slug === req.payload.config.admin.user,
  )
  const displayName = getWelcomeDisplay({
    useAsTitle: userCollection?.admin.useAsTitle,
    user,
  })
  const welcome = req.i18n.t('general:welcome')

  return (
    <section className="welcome-widget">
      <h1 className="welcome-widget__heading">
        {welcome}
        {displayName ? `, ${displayName}` : ''}
      </h1>
    </section>
  )
}
