'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

export type DescriptionFunction = () => string

export type DescriptionComponent = React.ComponentType<any>

type Description = DescriptionComponent | DescriptionFunction | Record<string, string> | string

export type ViewDescriptionProps = {
  description?: Description
}

export function isComponent(description: Description): description is DescriptionComponent {
  return React.isValidElement(description)
}

const ViewDescription: React.FC<ViewDescriptionProps> = (props) => {
  const { i18n } = useTranslation()
  const { description } = props

  if (isComponent(description)) {
    const Description = description
    return <Description />
  }

  if (description) {
    return (
      <div className="view-description">
        {typeof description === 'function' ? description() : getTranslation(description, i18n)}
      </div>
    )
  }

  return null
}

export default ViewDescription
