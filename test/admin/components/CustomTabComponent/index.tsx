import type { DocumentTabComponent } from 'payload'

import React from 'react'

import { CustomTabComponentClient } from './client.js'
import './index.scss'

export const CustomTabComponent: DocumentTabComponent = (props) => {
  const { path } = props

  return (
    <li className="custom-doc-tab">
      <CustomTabComponentClient path={path} />
    </li>
  )
}
