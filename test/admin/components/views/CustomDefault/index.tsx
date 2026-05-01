import type { AdminViewServerProps } from 'payload'

import { Button, SetStepNav } from '@payloadcms/ui'
import React from 'react'

import { customViewPath } from '../../../shared.js'
import './index.scss'

const baseClass = 'custom-default-view'

export function CustomDefaultView({ initPageResult }: AdminViewServerProps) {
  const {
    permissions,
    req: {
      payload: {
        config: {
          routes: { admin: adminRoute },
        },
      },
      user,
    },
  } = initPageResult

  if (!user || (user && !permissions?.canAccessAdmin)) {
    return null
  }

  return (
    <React.Fragment>
      <SetStepNav
        nav={[
          {
            label: 'Custom Admin View with Default Template',
          },
        ]}
      />
      <div
        className={`${baseClass}__content`}
        style={{
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Admin View</h1>
        <p>
          Here is a custom admin view that was added in the Payload config. It uses the Default
          Template, so the sidebar is rendered.
        </p>
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
    </React.Fragment>
  )
}
