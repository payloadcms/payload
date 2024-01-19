import React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { LabelProps } from 'payload/types'

import './index.scss'

const Label: React.FC<LabelProps> = (props) => {
  const { htmlFor, label, required = false, i18n } = props

  if (label) {
    return (
      <label className="field-label" htmlFor={htmlFor}>
        {getTranslation(label, i18n)}
        {required && <span className="required">*</span>}
      </label>
    )
  }

  return null
}

export default Label
