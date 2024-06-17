import type { EditViewComponent } from 'payload'

import { SetStepNav } from '@payloadcms/ui/elements/StepNav'
import { notFound } from 'next/navigation.js'
import React, { Fragment } from 'react'

import { customTabLabelViewTitle } from '../../../shared.js'

export const CustomTabLabelView: EditViewComponent = ({ initPageResult }) => {
  if (!initPageResult) {
    notFound()
  }

  return (
    <Fragment>
      <SetStepNav
        nav={[
          {
            label: 'Custom Tab View',
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
        <h1 id="custom-view-title">{customTabLabelViewTitle}</h1>
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
