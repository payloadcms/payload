'use client'

import type { GenericErrorProps } from 'payload'

import React from 'react'

import { Tooltip } from '../../elements/Tooltip/index.js'
import { useForm, useFormFields, useFormSubmitted } from '../../forms/Form/context.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { generateFieldID } from '../../utilities/generateFieldID.js'
import './index.css'

const baseClass = 'field-error'

export const FieldError: React.FC<
  {
    announce?: boolean
  } & GenericErrorProps
> = (props) => {
  const {
    alignCaret = 'right',
    announce = false,
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

  return (
    <React.Fragment>
      {announce && (
        <span aria-atomic="true" className="sr-only" role="alert">
          {showMessage ? message : ''}
        </span>
      )}
      {showMessage && message?.length ? (
        <Tooltip
          alignCaret={alignCaret}
          className={baseClass}
          delay={0}
          id={generateFieldID(path, editDepth, uuid, 'field-error')}
          staticPositioning
        >
          {message}
        </Tooltip>
      ) : null}
    </React.Fragment>
  )
}
