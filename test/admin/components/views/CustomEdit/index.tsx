import React, { Fragment, useEffect } from 'react'
import { Redirect, useParams } from 'react-router-dom'

import Button from '../../../../../packages/payload/src/admin/components/elements/Button'
import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
import { useConfig } from '../../../../../packages/payload/src/admin/components/utilities/Config'
import { type CustomAdminView } from '../../../../../packages/payload/src/config/types'

const CustomEditView: CustomAdminView = ({ canAccessAdmin, collection, global, user }) => {
  const {
    routes: { admin: adminRoute },
  } = useConfig()

  const params = useParams()

  const { setStepNav } = useStepNav()

  // This effect will only run one time and will allow us
  // to set the step nav to display our custom route name

  useEffect(() => {
    setStepNav([
      {
        label: 'Custom Edit View',
      },
    ])
  }, [setStepNav])

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !canAccessAdmin)) {
    return <Redirect to={`${adminRoute}/unauthorized`} />
  }

  let versionsRoute = ''
  let customRoute = ''

  if (collection) {
    versionsRoute = `${adminRoute}/collections/${collection?.slug}/${params.id}/versions`
    customRoute = `${adminRoute}/collections/${collection?.slug}/${params.id}/custom`
  }

  if (global) {
    versionsRoute = `${adminRoute}/globals/${global?.slug}/versions`
    customRoute = `${adminRoute}/globals/${global?.slug}/custom`
  }

  return (
    <Fragment>
      <div
        style={{
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Edit View</h1>
        <p>This custom edit view was added through one of the following Payload configs:</p>
        <ul>
          <li>
            <code>components.views.Edit</code>
            <p>
              {'This takes precedence over the default edit view, '}
              <b>as well as all nested views like versions.</b>
            </p>
          </li>
          <li>
            <code>components.views.Edit.Default</code>
            <p>
              {'This allows you to override only the default edit view, but '}
              <b>
                <em>not</em>
              </b>
              {' any nested views like versions, etc.'}
            </p>
          </li>
          <li>
            <code>components.views.Edit.Default.Component</code>
            <p>
              This is the most granular override, allowing you to override only the default edit
              view&apos;s Component, and its other properties like path and label.
            </p>
          </li>
        </ul>
        <Button buttonStyle="primary" el="link" to={versionsRoute}>
          Custom Versions
        </Button>
        &nbsp; &nbsp; &nbsp;
        <Button buttonStyle="secondary" el="link" to={customRoute}>
          Custom View
        </Button>
      </div>
    </Fragment>
  )
}

export default CustomEditView
