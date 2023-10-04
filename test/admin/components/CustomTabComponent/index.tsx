import React from 'react'
import { Link, useRouteMatch } from 'react-router-dom'

import type { DocumentTabComponent } from '../../../../packages/payload/src/admin/components/elements/DocumentHeader/Tabs/types'

import './index.scss'

const CustomTabComponent: DocumentTabComponent = (props) => {
  const { path } = props
  const match = useRouteMatch()

  return (
    <li className="custom-doc-tab">
      <Link to={`${match.url}${path}`}>Custom Tab Component</Link>
    </li>
  )
}

export default CustomTabComponent
