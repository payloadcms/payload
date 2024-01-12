import React from 'react'

import { Tooltip } from '../../elements/Tooltip'
import './index.scss'
import type { ErrorProps } from 'payload/types'

const baseClass = 'field-error'

const Error: React.FC<ErrorProps> = (props) => {
  const { alignCaret = 'right', message, showError = false } = props

  if (showError) {
    return (
      <Tooltip alignCaret={alignCaret} className={baseClass} delay={0}>
        {message}
      </Tooltip>
    )
  }

  return null
}

export default Error
