'use client'
import type { FieldDescriptionProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
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
  const { CustomDescription } = props

  if (CustomDescription !== undefined) {
    return CustomDescription
  }

  return <DefaultFieldDescription {...props} />
}
