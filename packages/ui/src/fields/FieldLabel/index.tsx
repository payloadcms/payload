'use client'

import type { GenericLabelProps } from '@ruya.sa/payload'

import { getTranslation } from '@ruya.sa/translations'
import React from 'react'

import { useForm } from '../../forms/Form/context.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import './index.scss'

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
  const { code, label: localLabel } = useLocale()

  const Element =
    ElementFromProps === 'label' ? (htmlFor ? 'label' : 'span') : ElementFromProps || 'span'

  if (label) {
    return (
      <Element className={`field-label${unstyled ? ' unstyled' : ''}`} htmlFor={htmlFor}>
        {getTranslation(label, i18n)}
        {required && !unstyled && <span className="required">*</span>}
        {localized && !hideLocale && (
          <span className="localized">
            &mdash; {typeof localLabel === 'string' ? localLabel : code}
          </span>
        )}
      </Element>
    )
  }

  return null
}
