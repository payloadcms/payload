import type { WidgetServerProps } from 'payload'

import React from 'react'

import { getWelcomeDisplay } from './getWelcomeDisplay'
import './index.css'

export function WelcomeWidget({ req, user }: WidgetServerProps) {
  const userCollection = req.payload.config.collections.find(
    ({ slug }) => slug === req.payload.config.admin.user,
  )
  const displayName = getWelcomeDisplay({
    useAsTitle: userCollection?.admin.useAsTitle,
    user,
  })

  return (
    <section className="welcome-widget">
      <h1 className="welcome-widget__heading">Welcome{displayName ? `, ${displayName}` : ''}</h1>
    </section>
  )
}
