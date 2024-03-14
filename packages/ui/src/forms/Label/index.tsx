'use client'
import type { LabelProps } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import { useFieldProps } from '../FieldPropsProvider/index.js'
import { useForm } from '../Form/context.js'
import './index.scss'

const Label: React.FC<LabelProps> = (props) => {
  const { htmlFor: htmlForFromProps, label, required = false } = props
  const { uuid } = useForm()
  const { path } = useFieldProps()
  const htmlFor = htmlForFromProps || generateFieldID(path, uuid)

  const { i18n } = useTranslation()

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
