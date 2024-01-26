'use client'
import React from 'react'

import type { Props } from './types'

import { getTranslation } from '@payloadcms/translations'
import { useTranslation } from '../../providers/Translation'

import './index.scss'

const baseClass = 'field-description'

const FieldDescription: React.FC<Props> = (props) => {
  const { className, description, marginPlacement } = props

  const { i18n } = useTranslation()

  if (description) {
    return (
      <div
        className={[
          baseClass,
          className,
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

export default FieldDescription
