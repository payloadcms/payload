'use client'
import type { DescriptionFunction, MappedComponent, StaticDescription } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { RenderComponent } from '../RenderComponent/index.js'
import './index.scss'

export type ViewDescriptionComponent = React.ComponentType<any>

type Description = DescriptionFunction | StaticDescription | string | ViewDescriptionComponent

export type ViewDescriptionProps = {
  readonly Description?: MappedComponent
  readonly description?: StaticDescription
}

export function isComponent(description: Description): description is ViewDescriptionComponent {
  return React.isValidElement(description)
}

export const ViewDescription: React.FC<ViewDescriptionProps> = (props) => {
  const { i18n } = useTranslation()
  const { Description, description, ...rest } = props

  if (Description) {
    return <RenderComponent clientProps={{ description, ...rest }} mappedComponent={Description} />
  }

  if (description) {
    return <div className="view-description">{getTranslation(description, i18n)}</div>
  }

  return null
}
