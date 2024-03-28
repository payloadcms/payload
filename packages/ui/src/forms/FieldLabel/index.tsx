'use client'

import type { LabelProps } from 'payload/types'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useTranslation } from '../../providers/Translation/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import { useFieldProps } from '../FieldPropsProvider/index.js'
import { useForm } from '../Form/context.js'
import './index.scss'

const DefaultFieldLabel: React.FC<LabelProps> = (props) => {
  const {
    htmlFor: htmlForFromProps,
    label: labelFromProps,
    required = false,
    unstyled = false,
  } = props

  const { uuid } = useForm()
  const { path } = useFieldProps()
  const htmlFor = htmlForFromProps || generateFieldID(path, uuid)

  const { i18n } = useTranslation()

  if (labelFromProps) {
    return (
      <label className={`field-label ${unstyled ? 'unstyled' : ''}`} htmlFor={htmlFor}>
        {getTranslation(labelFromProps, i18n)}
        {required && !unstyled && <span className="required">*</span>}
      </label>
    )
  }

  return null
}

export const FieldLabel: React.FC<LabelProps> = (props) => {
  const { CustomLabel } = props

  if (CustomLabel !== undefined) {
    return CustomLabel
  }

  return <DefaultFieldLabel {...props} />
}
