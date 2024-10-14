'use client'

import type { FieldLabelClientComponent, GenericLabelProps, StaticLabel } from 'payload'

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

export const FieldLabel: FieldLabelClientComponent = (props) => {
  const { Label, ...rest } = props

  // Don't get `Label` from `field.admin.components.Label` here because
  // this will cause an infinite loop when threading field through custom usages of `FieldLabel`
  if (Label) {
    return <RenderComponent clientProps={rest} mappedComponent={Label} />
  }

  return (
    <DefaultFieldLabel
      {...rest}
      label={
        typeof props?.label !== 'undefined'
          ? props.label
          : props?.field && 'label' in props.field && (props.field.label as StaticLabel) // type assertion needed for `row` fields
      }
      required={
        typeof props.required !== 'undefined'
          ? props.required
          : props?.field && 'required' in props.field && (props.field?.required as boolean) // type assertion needed for `group` fields
      }
    />
  )
}