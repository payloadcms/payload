import React from 'react'

import type { Props } from './types'

import Tooltip from '../../elements/Tooltip'

const Error: React.FC<Props> = (props) => {
  const { alignCaret = 'right', message, showError = false } = props

  if (showError) {
    return (
      <Tooltip alignCaret={alignCaret} className="tooltip--error" delay={0}>
        {message}
      </Tooltip>
    )
  }

  return null
}

export default Error
