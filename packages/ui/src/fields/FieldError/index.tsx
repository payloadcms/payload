'use client'

import type { GenericErrorProps } from 'payload'

import React from 'react'

import { Tooltip } from '../../elements/Tooltip/index.js'
import { useFormFields, useFormSubmitted } from '../../forms/Form/context.js'
import { useAdminValidateError } from '../../providers/AdminValidateErrors/index.js'
import './index.scss'

const baseClass = 'field-error'

export const FieldError: React.FC<GenericErrorProps> = (props) => {
  const {
    alignCaret = 'right',
    message: messageFromProps,
    path,
    showError: showErrorFromProps,
  } = props

  const hasSubmitted = useFormSubmitted()
  const field = useFormFields(([fields]) => (fields && fields?.[path]) || null)
  // Phase 8: client-side admin.validate produces live errors that should
  // surface immediately on every edit — no submit gate. Falls back to the
  // existing server-driven `errorMessage` flow when no client-side
  // validator is registered for this path.
  const adminValidateError = useAdminValidateError(path)

  const { errorMessage, valid } = field || {}

  const message = messageFromProps || adminValidateError || errorMessage
  const showMessage =
    showErrorFromProps || Boolean(adminValidateError) || (hasSubmitted && valid === false)

  if (showMessage && message?.length) {
    return (
      <Tooltip alignCaret={alignCaret} className={baseClass} delay={0} staticPositioning>
        {message}
      </Tooltip>
    )
  }

  return null
}
