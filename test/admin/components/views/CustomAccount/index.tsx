import React, { Fragment } from 'react'

import type { AdminViewComponent } from '../../../../../packages/payload/src/config/types'

const CustomAccountView: AdminViewComponent = () => {
  return (
    <Fragment>
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Account View</h1>
        <p>This custom view was added through the Payload config:</p>
        <ul>
          <li>
            <code>components.views.Account</code>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}

export default CustomAccountView
