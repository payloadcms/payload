'use client'

import type { DocumentTabComponent } from 'payload/types'

import React from 'react'
import { Link, useRouteMatch } from 'react-router-dom'

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
