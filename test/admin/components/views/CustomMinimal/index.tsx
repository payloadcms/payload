import LinkImport from 'next/link.js'
import React from 'react'

// As this is the demo project, we import our dependencies from the `src` directory.

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

// In your projects, you can import as follows:
// import { MinimalTemplate } from 'payload/components/templates';
// import { Button } from 'payload/components/elements';
// import { useConfig } from 'payload/components/utilities';

import { Button } from '@payloadcms/ui/elements/Button'

import type { AdminViewProps } from '../../../../../packages/payload/types.js'

import { customViewPath } from '../../../shared.js'
import './index.scss'

const baseClass = 'custom-minimal-view'

export const CustomMinimalView: React.FC<AdminViewProps> = ({ initPageResult }) => {
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
    <div className={baseClass}>
      <div className={`${baseClass}__content`}>
        <h1>Custom Admin View</h1>
        <p>Here is a custom admin view that was added in the Payload config.</p>
        <div className={`${baseClass}__controls`}>
          <div className="custom-view__controls">
            <Button Link={Link} buttonStyle="secondary" el="link" to={`${adminRoute}`}>
              Go to Dashboard
            </Button>
            &nbsp; &nbsp; &nbsp;
            <Button
              Link={Link}
              buttonStyle="secondary"
              el="link"
              to={`${adminRoute}/${customViewPath}`}
            >
              Go to Custom View
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
