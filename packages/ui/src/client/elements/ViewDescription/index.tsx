'use client'
import type { DescriptionFunction, StaticDescription, ViewDescriptionClientProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'

export type ViewDescriptionComponent = React.ComponentType<any>

type Description = DescriptionFunction | StaticDescription | string | ViewDescriptionComponent

export function isComponent(description: Description): description is ViewDescriptionComponent {
  return React.isValidElement(description)
}

export function ViewDescription(props: ViewDescriptionClientProps) {
  const { i18n } = useTranslation()
  const { description } = props

  if (description) {
    return <div className="custom-view-description">{getTranslation(description, i18n)}</div>
  }

  return null
}
