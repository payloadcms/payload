'use client'

import type { FieldErrorClientComponent, GenericErrorProps } from 'payload'

import React from 'react'

import { Tooltip } from '../../elements/Tooltip/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useFormFields, useFormSubmitted } from '../../forms/Form/context.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import './index.scss'

const baseClass = 'field-error'

const DefaultFieldError: React.FC<GenericErrorProps> = (props) => {
  const {
    alignCaret = 'right',
    message: messageFromProps,
    path: pathFromProps,
    showError: showErrorFromProps,
  } = props

  const { path: pathFromContext } = useFieldProps()
  const path = pathFromContext ?? pathFromProps

  const hasSubmitted = useFormSubmitted()
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const { errorMessage, valid } = field || {}

  const message = messageFromProps || errorMessage
  const showMessage = showErrorFromProps || (hasSubmitted && valid === false)

  if (showMessage && message?.length) {
    return (
      <Tooltip alignCaret={alignCaret} className={baseClass} delay={0} staticPositioning>
        {message}
      </Tooltip>
    )
  }

  return null
}

export const FieldError: FieldErrorClientComponent = (props) => {
  const { CustomError, ...rest } = props

  if (CustomError) {
    return <RenderComponent clientProps={rest} mappedComponent={CustomError} />
  }

  return <DefaultFieldError {...rest} />
}
