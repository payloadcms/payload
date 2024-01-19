'use client'
import React from 'react'

import { Tooltip } from '../../elements/Tooltip'
import type { ErrorProps } from 'payload/types'
import useField from '../useField'

import './index.scss'

const baseClass = 'field-error'

const Error: React.FC<ErrorProps> = (props) => {
  const {
    alignCaret = 'right',
    message: messageFromProps,
    path,
    showError: showErrorFromProps,
  } = props

  const { valid, errorMessage } = useField({ path })

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
