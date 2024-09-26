'use client'

import type { GenericErrorProps } from 'payload'

import React from 'react'

import { Tooltip } from '../../elements/Tooltip/index.js'
import { useFieldProps } from '../../forms/FieldPropsProvider/index.js'
import { useFormFields, useFormSubmitted } from '../../forms/Form/context.js'
import './index.scss'

const baseClass = 'field-error'

export const FieldError: React.FC<GenericErrorProps> = (props) => {
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
