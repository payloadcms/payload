import LinkImport from 'next/link.js'
import React from 'react'

import { Button } from '../../../../../packages/ui/src/elements/Button/index.js'
// As this is the demo project, we import our dependencies from the `src` directory.
import { MinimalTemplate } from '../../../../../packages/ui/src/templates/Minimal/index.js'

const Link = (LinkImport.default || LinkImport) as unknown as typeof LinkImport.default

// In your projects, you can import as follows:
// import { MinimalTemplate } from 'payload/components/templates';
// import { Button } from 'payload/components/elements';
// import { useConfig } from 'payload/components/utilities';

import type { AdminViewProps } from 'payload/types.js'

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
    <MinimalTemplate className={baseClass}>
      <div className={`${baseClass}__content`}>
        <h1>Custom Admin View</h1>
        <p>Here is a custom admin view that was added in the Payload config.</p>
        <div className={`${baseClass}__controls`}>
          <Button
            Link={Link}
            className={`${baseClass}__login-btn`}
            el="link"
            to={`${adminRoute}/login`}
          >
            Go to Login
          </Button>
          <Button Link={Link} buttonStyle="secondary" el="link" to={`${adminRoute}`}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </MinimalTemplate>
  )
}
