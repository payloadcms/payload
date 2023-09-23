import React from 'react'
import { Link, useRouteMatch } from 'react-router-dom'

import type { DocumentTabProps } from '../../../../packages/payload/src/admin/components/elements/DocumentHeader/Tabs/types'

import './index.scss'

const CustomTabComponent: React.FC<DocumentTabProps> = (props) => {
  const { path } = props
  const match = useRouteMatch()

  return (
    <Link className="custom-doc-tab" to={`${match.url}${path}`}>
      Custom Tab Component
    </Link>
  )
}

export default CustomTabComponent
