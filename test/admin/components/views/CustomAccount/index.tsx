import type { AdminViewServerProps } from 'payload'

import React, { Fragment } from 'react'

export function CustomAccountView(props: AdminViewServerProps) {
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
