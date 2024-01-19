'use client'
import React from 'react'

import { Tooltip } from '../../elements/Tooltip'
import type { ErrorProps } from 'payload/types'
import { useFormFields } from '../Form/context'

import './index.scss'

const baseClass = 'field-error'

const Error: React.FC<ErrorProps> = (props) => {
  const {
    alignCaret = 'right',
    message: messageFromProps,
    path,
    showError: showErrorFromProps,
  } = props

  const field = useFormFields(([fields]) => fields[path])

  const { valid, errorMessage } = field || {}

  const message = messageFromProps || errorMessage
  const showMessage = showErrorFromProps || !valid

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
