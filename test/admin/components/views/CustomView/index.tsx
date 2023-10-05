import React, { Fragment, useEffect } from 'react'

import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
import { type EditViewComponent } from '../../../../../packages/payload/src/config/types'

const CustomView: EditViewComponent = () => {
  const { setStepNav } = useStepNav()

  // This effect will only run one time and will allow us
  // to set the step nav to display our custom route name

  useEffect(() => {
    setStepNav([
      {
        label: 'Custom View',
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
        <h1>Custom View</h1>
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

export default CustomView
