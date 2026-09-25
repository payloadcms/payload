'use client'

import type { GenericErrorProps } from 'payload'

import React from 'react'

import { Tooltip } from '../../elements/Tooltip/index.js'
import { useForm, useFormFields, useFormSubmitted } from '../../forms/Form/context.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import './index.css'

const baseClass = 'field-error'

export const FieldError: React.FC<GenericErrorProps> = (props) => {
  const {
    alignCaret = 'right',
    message: messageFromProps,
    path,
    showError: showErrorFromProps,
  } = props

  const hasSubmitted = useFormSubmitted()
  const { uuid } = useForm()
  const editDepth = useEditDepth()
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)

  const { errorMessage, valid } = field || {}

  const message = messageFromProps || errorMessage
  const showMessage = showErrorFromProps || (hasSubmitted && valid === false)

  if (showMessage && message?.length) {
    return (
      <Tooltip
        alignCaret={alignCaret}
        className={baseClass}
        delay={0}
        id={generateFieldID(path, editDepth, uuid, 'field-error')}
        staticPositioning
      >
        {message}
      </Tooltip>
    )
  }

  return null
}
