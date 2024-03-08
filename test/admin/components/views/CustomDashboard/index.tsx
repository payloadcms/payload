import React, { Fragment } from 'react'

import type { AdminViewComponent } from '../../../../../packages/payload/src/admin/types.js'

export const CustomDashboardView: AdminViewComponent = () => {
  return (
    <Fragment>
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Dashboard View</h1>
        <p>This custom view was added through the Payload config:</p>
        <ul>
          <li>
            <code>components.views.Dashboard</code>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}
