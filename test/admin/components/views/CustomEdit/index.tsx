import type { DocumentViewServerProps } from 'payload'

import { SetStepNav } from '@payloadcms/ui'
import { notFound, redirect } from 'next/navigation.js'
import React, { Fragment } from 'react'

export function CustomEditView({ initPageResult }: DocumentViewServerProps) {
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
            label: 'Custom Edit View',
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
        <h1>Custom Edit View</h1>
        <p>This custom edit view was added through the following Payload config:</p>
        <code>components.views.edit</code>
        <p>
          {'This takes precedence over the default edit view, '}
          <b>as well as all nested views like versions.</b>
          {' The document header will be completely overridden.'}
        </p>
      </div>
    </Fragment>
  )
}
