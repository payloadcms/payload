import React, { Fragment, useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import type { AdminViewComponent } from '../../../../../packages/payload/src/config/types'

import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
import { useConfig } from '../../../../../packages/payload/src/admin/components/utilities/Config'

const CustomDefaultEditView: AdminViewComponent = ({
  canAccessAdmin,
  // collection,
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
        label: 'Custom Default View',
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
        <h1>Custom Default View</h1>
        <p>This custom Default view was added through one of the following Payload configs:</p>
        <ul>
          <li>
            <code>components.views.Edit.Default</code>
            <p>
              {'This allows you to override only the default edit view specifically, but '}
              <b>
                <em>not</em>
              </b>
              {
                ' any nested views like versions, etc. The document header will render above this component.'
              }
            </p>
          </li>
          <li>
            <code>components.views.Edit.Default.Component</code>
            <p>
              This is the most granular override, allowing you to override only the Default
              component, or any of its other properties like path and label.
            </p>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}

export default CustomDefaultEditView
