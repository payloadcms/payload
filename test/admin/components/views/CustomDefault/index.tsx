import React, { useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import type { AdminViewComponent } from '../../../../../packages/payload/src/config/types'

import Button from '../../../../../packages/payload/src/admin/components/elements/Button'
import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
// As this is the demo project, we import our dependencies from the `src` directory.
import DefaultTemplate from '../../../../../packages/payload/src/admin/components/templates/Default'
import { useConfig } from '../../../../../packages/payload/src/admin/components/utilities/Config'
import Meta from '../../../../../packages/payload/src/admin/components/utilities/Meta'

// In your projects, you can import as follows:
// import { DefaultTemplate } from 'payload/components/templates';
// import { Button, Eyebrow } from 'payload/components/elements';
// import { AdminView } from 'payload/config';
// import { useStepNav } from 'payload/components/hooks';
// import { useConfig, Meta } from 'payload/components/utilities';

import './index.scss'

const baseClass = 'custom-default-view'

const CustomDefaultView: AdminViewComponent = ({ canAccessAdmin, user }) => {
  const {
    routes: { admin: adminRoute },
  } = useConfig()

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

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !canAccessAdmin)) {
    return <Redirect to={`${adminRoute}/unauthorized`} />
  }

  return (
    <DefaultTemplate>
      <Meta
        description="Building custom views into Payload is easy."
        keywords="Custom React Components, Payload, CMS"
        title="Custom Admin View with Default Template"
      />
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
    </DefaultTemplate>
  )
}

export default CustomDefaultView
