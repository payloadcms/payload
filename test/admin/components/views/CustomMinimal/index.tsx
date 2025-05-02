import LinkImport from 'next/link.js'
import React from 'react'

// As this is the demo project, we import our dependencies from the `src` directory.

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

// In your projects, you can import as follows:
// import { MinimalTemplate } from 'payload/components/templates';
// import { Button } from 'payload/components/elements';
// import { useConfig } from 'payload/components/utilities';

import type { AdminViewServerProps } from 'payload'

import { MinimalTemplate } from '@payloadcms/next/templates'
import { Button } from '@payloadcms/ui'

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
      </div>
    </MinimalTemplate>
  )
}
