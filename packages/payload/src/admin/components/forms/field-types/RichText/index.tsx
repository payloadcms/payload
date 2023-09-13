import React from 'react'

import type { RichTextField } from '../../../../../fields/config/types'

const RichText: React.FC<RichTextField> = (props) => {
  return <props.editor.FieldComponent {...props} />
}

export default RichText
