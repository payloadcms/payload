import type { DocumentViewServerProps } from 'payload'

import { SetStepNav } from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { customTabViewComponentTitle } from '../../../shared.js'

export function CustomTabComponentView({ initPageResult }: DocumentViewServerProps) {
  if (!initPageResult) {
    notFound()
  }

  return (
    <Fragment>
      <SetStepNav
        nav={[
          {
            label: 'Custom Tab View 2',
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
        <h1 id="custom-view-title">{customTabViewComponentTitle}</h1>
        <p>This custom view was added through the Payload config:</p>
        <ul>
          <li>
            <code>components.views[key].Component</code>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}
