'use client'

import type { GenericLabelProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useForm } from '../../forms/Form/context.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import './index.css'

export const FieldLabel: React.FC<GenericLabelProps> = (props) => {
  const {
    as: ElementFromProps = 'label',
    hideLocale = false,
    htmlFor: htmlForFromProps,
    label,
    localized = false,
    path,
    required = false,
    unstyled = false,
  } = props

  const { uuid } = useForm()
  const editDepth = useEditDepth()

  const htmlFor = htmlForFromProps || generateFieldID(path, editDepth, uuid)

  const { i18n } = useTranslation()
  const locale = useLocale()
  const code = locale?.code
  const localLabel = locale?.label

  const Element =
    ElementFromProps === 'label' ? (htmlFor ? 'label' : 'span') : ElementFromProps || 'span'

  if (label) {
    return (
      <Element className={`field-label${unstyled ? ' unstyled' : ''}`} htmlFor={htmlFor}>
        {getTranslation(label, i18n)}
        {required && !unstyled && <span className="required">*</span>}
        {localized && !hideLocale && locale && (
          <span className="localized">
            &mdash; {typeof localLabel === 'string' ? localLabel : code}
          </span>
        )}
      </Element>
    )
  }

  return null
}
