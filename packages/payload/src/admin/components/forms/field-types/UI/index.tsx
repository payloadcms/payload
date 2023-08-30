import React from 'react'

import type { UIField } from '../../../../../fields/config/types.js'

import withCondition from '../../withCondition/index.js'

const UI: React.FC<UIField> = (props) => {
  const {
    admin: {
      components: { Field },
    },
  } = props

  if (Field) {
    return <Field {...props} />
  }

  return null
}

export default withCondition(UI)
