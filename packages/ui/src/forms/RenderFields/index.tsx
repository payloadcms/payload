'use client'
import React, { Fragment } from 'react'
import type { Props } from './types'
import { useTranslation } from '../../providers/Translation'

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
        {fieldMap?.map(({ Field }, fieldIndex) => <Fragment key={fieldIndex}>{Field}</Fragment>)}
      </div>
    )
  }

  return null
}

export default RenderFields
