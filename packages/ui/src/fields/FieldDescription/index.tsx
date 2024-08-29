'use client'
import type { FieldDescriptionClientComponent, GenericDescriptionProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'field-description'

const DefaultFieldDescription: React.FC<GenericDescriptionProps> = (props) => {
  const { className, description, marginPlacement } = props

  const { path } = useFieldProps()

  const { i18n } = useTranslation()

  if (description) {
    return (
      <div
        className={[
          baseClass,
          className,
          `field-description-${path.replace(/\./g, '__')}`,
          marginPlacement && `${baseClass}--margin-${marginPlacement}`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {getTranslation(description, i18n)}
      </div>
    )
  }

  return null
}

export const FieldDescription: FieldDescriptionClientComponent = (props) => {
  const { Description, ...rest } = props

  if (Description) {
    return <RenderComponent clientProps={rest} mappedComponent={Description} />
  }

  return <DefaultFieldDescription {...rest} />
}
