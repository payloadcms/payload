import React, { Fragment, useEffect } from 'react'

import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
import { type AdminViewComponent } from '../../../../../packages/payload/src/config/types'
import { customTabViewTitle } from '../../../shared'

const CustomTabView: AdminViewComponent = () => {
  const { setStepNav } = useStepNav()

  // This effect will only run one time and will allow us
  // to set the step nav to display our custom route name

  useEffect(() => {
    setStepNav([
      {
        label: 'Custom Tab View',
      },
    ])
  }, [setStepNav])

  return (
    <Fragment>
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}
      >
        <h1 id="custom-view-title">{customTabViewTitle}</h1>
        <p>This custom view was added through the Payload config:</p>
        <ul>
          <li>
            <code>components.views[key].Component</code>
          </li>
        </ul>
      </div>
    </Fragment>
  )
}

export default CustomTabView
