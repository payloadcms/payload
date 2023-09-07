import React, { Fragment, useEffect } from 'react'
import { Redirect, useParams } from 'react-router-dom'

import Button from '../../../../../packages/payload/src/admin/components/elements/Button'
import Eyebrow from '../../../../../packages/payload/src/admin/components/elements/Eyebrow'
import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
import { useConfig } from '../../../../../packages/payload/src/admin/components/utilities/Config'
import { type CustomAdminView } from '../../../../../packages/payload/src/config/types'

const CustomVersionsView: CustomAdminView = ({ canAccessAdmin, collection, global, user }) => {
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
        label: 'Custom Versions View',
      },
    ])
  }, [setStepNav])

  // If an unauthorized user tries to navigate straight to this page,
  // Boot 'em out
  if (!user || (user && !canAccessAdmin)) {
    return <Redirect to={`${adminRoute}/unauthorized`} />
  }

  let backURL = adminRoute

  if (collection) backURL = `${adminRoute}/collections/${collection?.slug}/${params.id}`

  if (global) backURL = `${adminRoute}/globals/${global?.slug}`

  return (
    <Fragment>
      <Eyebrow />
      <div
        style={{
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Versions View</h1>
        <p>This custom versions view was added through one of the following Payload configs:</p>
        <ul>
          <li>
            <code>components.views.Versions</code>
            <p>
              {'This takes precedence over the default versions view, '}
              <b>as well as all nested views like /versions/:id.</b>
            </p>
          </li>
          <li>
            <code>components.views.Edit.versions</code>
            <p>Same as above.</p>
          </li>
          <li>
            <code>components.views.Edit.versions.Component</code>
          </li>
          <p>
            This is the most granular override, allowing you to override only the default versions
            view&apos;s Component, and its other properties like path and label.
          </p>
        </ul>
        <Button buttonStyle="primary" el="link" to={backURL}>
          Edit
        </Button>
        &nbsp; &nbsp; &nbsp;
        <Button buttonStyle="secondary" el="link" to={adminRoute}>
          Go to Dashboard
        </Button>
      </div>
    </Fragment>
  )
}

export default CustomVersionsView
