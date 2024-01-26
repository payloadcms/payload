'use client'
import React from 'react'

import { Tooltip } from '../../elements/Tooltip'
import type { ErrorProps } from 'payload/types'
import { useFormFields, useFormSubmitted } from '../Form/context'

import './index.scss'

const baseClass = 'field-error'

const Error: React.FC<ErrorProps> = (props) => {
  const { alignCaret = 'right', message: messageFromProps, showError: showErrorFromProps } = props

  // TODO: get path from context
  const path = ''

  const hasSubmitted = useFormSubmitted()
  const field = useFormFields(([fields]) => fields[path])

  const { valid, errorMessage } = field || {}

  const message = messageFromProps || errorMessage
  const showMessage = showErrorFromProps || (hasSubmitted && !valid)

  if (showMessage) {
    return (
      <Tooltip alignCaret={alignCaret} className={baseClass} delay={0}>
        {message}
      </Tooltip>
    )
  }

  return null
}

export default Error
