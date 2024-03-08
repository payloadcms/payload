'use client'

import React from 'react'
import { Link, useRouteMatch } from 'react-router-dom'

import type { DocumentTabComponent } from '../../../../packages/payload/src/admin/types.js'

import './index.scss'

export const CustomTabComponent: DocumentTabComponent = (props) => {
  const { path } = props
  const match = useRouteMatch()

  return (
    <li className="custom-doc-tab">
      <Link to={`${match.url}${path}`}>Custom Tab Component</Link>
    </li>
  )
}
