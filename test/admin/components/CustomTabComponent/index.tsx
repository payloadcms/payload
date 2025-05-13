import type { DocumentTabServerProps } from 'payload'

import React from 'react'

import { CustomTabComponentClient } from './client.js'
import './index.scss'

export function CustomTabComponent(props: DocumentTabServerProps) {
  const { path } = props

  return (
    <li className="custom-doc-tab">
      <CustomTabComponentClient path={path} />
    </li>
  )
}
