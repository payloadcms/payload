'use client'
import type { FieldDescriptionProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { RenderMappedComponent } from '../../providers/ComponentMap/RenderMappedComponent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import './index.scss'

const baseClass = 'field-description'

const DefaultFieldDescription: React.FC<FieldDescriptionProps> = (props) => {
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

export const FieldDescription: React.FC<FieldDescriptionProps> = (props) => {
  const { CustomDescription, ...rest } = props

  if (CustomDescription?.Component) {
    return <RenderMappedComponent clientProps={rest} component={CustomDescription} />
  }

  return <DefaultFieldDescription {...rest} />
}
