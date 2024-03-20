'use client'
import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import type { FieldDescriptionProps } from './types.js'

import { useTranslation } from '../../providers/Translation/index.js'
import { useFieldProps } from '../FieldPropsProvider/index.js'
import './index.scss'

export { FieldDescriptionProps }

const baseClass = 'field-description'

export const FieldDescription: React.FC<FieldDescriptionProps> = (props) => {
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
