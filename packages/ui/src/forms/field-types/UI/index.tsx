import React from 'react'

import type { UIField } from 'payload/types'

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

export default UI
