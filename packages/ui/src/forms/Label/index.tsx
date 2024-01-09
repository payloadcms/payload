import React from 'react'

import type { Props } from './types'

// import { getTranslation } from '@payloadcms/translations'
import './index.scss'

const Label: React.FC<Props> = (props) => {
  const { htmlFor, label, required = false } = props
  // const { i18n } = useTranslation()

  if (label) {
    return (
      <label className="field-label" htmlFor={htmlFor}>
        {typeof label === 'string' ? label : ''}
        {/* {getTranslation(label, i18n)} */}
        {required && <span className="required">*</span>}
      </label>
    )
  }

  return null
}

export default Label
