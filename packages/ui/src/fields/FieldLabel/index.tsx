'use client'

import type { GenericLabelProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useForm } from '../../forms/Form/context.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import './index.scss'

export const FieldLabel: React.FC<GenericLabelProps> = (props) => {
  const {
    as: Element = 'label',
    htmlFor: htmlForFromProps,
    label,
    path,
    required = false,
    unstyled = false,
  } = props

  const { uuid } = useForm()
  const editDepth = useEditDepth()
  const htmlFor = htmlForFromProps || generateFieldID(path, editDepth, uuid)

  const { i18n } = useTranslation()

  if (label) {
    return (
      <Element className={`field-label ${unstyled ? 'unstyled' : ''}`} htmlFor={htmlFor}>
        {getTranslation(label, i18n)}
        {required && !unstyled && <span className="required">*</span>}
      </Element>
    )
  }

  return null
}
