'use client'
import React from 'react'
import type { Props } from './types'
import { useTranslation } from '../../providers/Translation'
import { RenderField } from './RenderField'

import './index.scss'

const baseClass = 'render-fields'

const RenderFields: React.FC<Props> = (props) => {
  const { className, margins, fieldMap } = props

  const { i18n } = useTranslation()

  if (!i18n) {
    console.error('Need to implement i18n when calling RenderFields')
  }

  if (fieldMap) {
    return (
      <div
        className={[
          baseClass,
          className,
          margins && `${baseClass}--margins-${margins}`,
          margins === false && `${baseClass}--margins-none`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {fieldMap?.map(({ Field, name }, fieldIndex) => (
          <RenderField key={fieldIndex} name={name} Field={Field} />
        ))}
      </div>
    )
  }

  return null
}

export default RenderFields
