'use client'

import { redirect } from 'next/navigation.js'
import React, { useEffect } from 'react'

import type { AdminViewComponent } from '../../../../../packages/payload/src/admin/types.js'

import { Button } from '../../../../../packages/ui/src/elements/Button/index.js'
// TODO(3.0): Meta?
// import Meta from '../../../../../packages/payload/src/admin/components/utilities/Meta'
import { useStepNav } from '../../../../../packages/ui/src/elements/StepNav/index.js'
import { useConfig } from '../../../../../packages/ui/src/providers/Config/index.js'
// As this is the demo project, we import our dependencies from the `src` directory.

// In your projects, you can import as follows:
// import { DefaultTemplate } from 'payload/components/templates';
// import { Button, Eyebrow } from 'payload/components/elements';
// import { AdminView } from 'payload/config';
// import { useStepNav } from 'payload/components/hooks';
// import { useConfig, Meta } from 'payload/components/utilities';

// TODO: meta:
{
  /* <Meta
  description="Building custom views into Payload is easy."
  keywords="Custom React Components, Payload, CMS"
  title="Custom Admin View with Default Template"
/> */
}

import { useAuth } from '@payloadcms/ui'

import './index.scss'

const baseClass = 'custom-default-view'

export const CustomDefaultViewClient = () => {
  const config = useConfig()
  const user = useAuth()

  const {
    routes: { admin: adminRoute },
  } = config

  const { setStepNav } = useStepNav()

  // This effect will only run one time and will allow us
  // to set the step nav to display our custom route name

  useEffect(() => {
    setStepNav([
      {
        label: 'Custom Admin View with Default Template',
      },
    ])
  }, [setStepNav])

  return (
    <div
      className={`${baseClass}__content`}
      style={{
        paddingLeft: 'var(--gutter-h)',
        paddingRight: 'var(--gutter-h)',
      }}
    >
      <h1>Custom Admin View</h1>
      <p>
        Here is a custom admin view that was added in the Payload config. It uses the Default
        Template, so the sidebar is rendered.
      </p>
      <div className={`${baseClass}__controls`}>
        <Button buttonStyle="secondary" el="link" to={`${adminRoute}`}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
