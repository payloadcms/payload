import React, { Fragment, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import Button from '../../../../../packages/payload/src/admin/components/elements/Button'
import Eyebrow from '../../../../../packages/payload/src/admin/components/elements/Eyebrow'
import { useStepNav } from '../../../../../packages/payload/src/admin/components/elements/StepNav'
import { useConfig } from '../../../../../packages/payload/src/admin/components/utilities/Config'
import { type CustomAdminView } from '../../../../../packages/payload/src/config/types'

const CustomView: CustomAdminView = ({ collection, global }) => {
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
        label: 'Custom View',
      },
    ])
  }, [setStepNav])

  let backURL = ''
  let versionsRoute = ''

  if (collection) {
    backURL = `${adminRoute}/collections/${collection?.slug}/${params.id}`
    versionsRoute = `${adminRoute}/collections/${collection?.slug}/${params.id}/versions`
  }

  if (global) {
    backURL = `${adminRoute}/globals/${global?.slug}`
    versionsRoute = `${adminRoute}/globals/${global?.slug}/versions`
  }

  return (
    <Fragment>
      <Eyebrow />
      <div
        style={{
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
        <Button buttonStyle="secondary" el="link" to={backURL}>
          Back
        </Button>
      </div>
    </Fragment>
  )
}

export default CustomView
