import type { AdminViewServerProps } from 'payload'

import { Button } from '@payloadcms/ui'
import { MinimalTemplate } from '@payloadcms/ui/rsc'
import React from 'react'

import { customViewPath } from '../../../shared.js'
import './index.scss'

const baseClass = 'custom-minimal-view'

export function CustomMinimalView({ initPageResult }: AdminViewServerProps) {
  const {
    req: {
      payload: {
        config: {
          routes: { admin: adminRoute },
        },
      },
    },
  } = initPageResult

  return (
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__content`}>
        <h1>Custom Admin View</h1>
        <p>Here is a custom admin view that was added in the Payload config.</p>
        <div className={`${baseClass}__controls`}>
          <div className="custom-view__controls">
            <Button buttonStyle="secondary" el="link" to={`${adminRoute}`}>
              Go to Dashboard
            </Button>
            &nbsp; &nbsp; &nbsp;
            <Button buttonStyle="secondary" el="link" to={`${adminRoute}/${customViewPath}`}>
              Go to Custom View
            </Button>
          </div>
        </div>
      </div>
    </MinimalTemplate>
  )
}
