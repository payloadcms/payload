import React, { Fragment, useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import type { AdminViewComponent } from '../../../../../packages/payload/src/config/types'

import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
import { useConfig } from '../../../../../packages/payload/src/admin/components/utilities/Config'

const CustomEditView: AdminViewComponent = ({
  canAccessAdmin,
  //  collection,
  //  global,
  user,
}) => {
  const {
    routes: { admin: adminRoute },
  } = useConfig()

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

  return (
    <Fragment>
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1>Custom Edit View</h1>
        <p>This custom edit view was added through the following Payload config:</p>
        <code>components.views.Edit</code>
        <p>
          {'This takes precedence over the default edit view, '}
          <b>as well as all nested views like versions.</b>
          {' The document header will be completely overridden.'}
        </p>
      </div>
    </Fragment>
  )
}

export default CustomEditView
