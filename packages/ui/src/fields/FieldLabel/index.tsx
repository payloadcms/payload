'use client'

import type { GenericLabelProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React from 'react'

import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useForm } from '../../forms/Form/context.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import './index.scss'

const DefaultFieldLabel: React.FC<GenericLabelProps> = (props) => {
  const {
    as: Element = 'label',
    htmlFor: htmlForFromProps,
    label: labelFromProps,
    required = false,
    unstyled = false,
  } = props

  const { uuid } = useForm()
  const { path } = useFieldProps()
  const editDepth = useEditDepth()
  const htmlFor = htmlForFromProps || generateFieldID(path, editDepth, uuid)

  const { i18n } = useTranslation()

  if (labelFromProps) {
    return (
      <Element className={`field-label ${unstyled ? 'unstyled' : ''}`} htmlFor={htmlFor}>
        {getTranslation(labelFromProps, i18n)}
        {required && !unstyled && <span className="required">*</span>}
      </Element>
    )
  }

  return null
}

export const FieldLabel: React.FC<GenericLabelProps> = (props) => {
  const { CustomLabel, ...rest } = props

  if (CustomLabel) {
    return <RenderComponent clientProps={rest} mappedComponent={CustomLabel} />
  }

  return <DefaultFieldLabel {...rest} />
}
