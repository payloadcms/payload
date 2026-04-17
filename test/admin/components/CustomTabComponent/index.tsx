import type { DocumentTabServerProps } from 'payload'

import React from 'react'

import { CustomTabComponentClient } from './client.js'
import './index.scss'

type CustomTabComponentProps = {
  label: string
} & DocumentTabServerProps

export function CustomTabComponent(props: CustomTabComponentProps) {
  const { label, path } = props

  return (
    <li className="custom-doc-tab">
      <CustomTabComponentClient label={label} path={path} />
    </li>
  )
}
