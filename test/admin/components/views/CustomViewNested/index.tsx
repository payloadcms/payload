import type { AdminViewServerProps } from 'payload'

import { Button } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React from 'react'

import { customNestedViewTitle, customViewPath } from '../../../shared.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

export function CustomNestedView({ initPageResult }: AdminViewServerProps) {
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
    <div
      style={{
        marginTop: 'calc(var(--base) * 2)',
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
      }}
    >
      <h1 id="custom-view-title">{customNestedViewTitle}</h1>
      <p>This custom view was added through the Payload config:</p>
      <ul>
        <li>
          <code>components.views[key].Component</code>
        </li>
      </ul>
      <div className="custom-view__controls">
        <Button buttonStyle="secondary" el="link" Link={Link} to={`${adminRoute}`}>
          Go to Dashboard
        </Button>
        &nbsp; &nbsp; &nbsp;
        <Button
          buttonStyle="secondary"
          el="link"
          Link={Link}
          to={`${adminRoute}/${customViewPath}`}
        >
          Go to Custom View
        </Button>
      </div>
    </div>
  )
}
