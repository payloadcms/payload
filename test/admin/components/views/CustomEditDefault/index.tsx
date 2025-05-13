import type { DocumentViewServerProps } from 'payload'

import { SetStepNav } from '@payloadcms/ui'
import { notFound, redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

export function CustomDefaultEditView({ initPageResult }: DocumentViewServerProps) {
  if (!initPageResult) {
    notFound()
  }

  const {
    permissions: { canAccessAdmin },
    req: {
      payload: {
        config: {
          routes: { admin: adminRoute },
        },
      },
      user,
    },
  } = initPageResult

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !canAccessAdmin)) {
    return redirect(`${adminRoute}/unauthorized`)
  }

  return (
    <Fragment>
      <SetStepNav
        nav={[
          {
            label: 'Custom Default View',
          },
        ]}
      />
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Default View</h1>
        <p>This custom Default view was added through one of the following Payload configs:</p>
        <ul>
          <li>
            <code>components.views.edit.default</code>
            <p>
              {'This allows you to override only the default edit view specifically, but '}
              <b>
                <em>not</em>
              </b>
              {
                ' any nested views like versions, etc. The document header will render above this component.'
              }
            </p>
          </li>
          <li>
            <code>components.views.edit.default.Component</code>
            <p>
              This is the most granular override, allowing you to override only the Default
              component, or any of its other properties like path and label.
            </p>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}
