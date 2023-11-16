import React from 'react'

import type { RichTextField } from '../../../../../fields/config/types'
import type { RichTextAdapter } from './types'

const RichText: React.FC<RichTextField> = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = props.editor
  return <editor.FieldComponent {...props} />
}

export default RichText
