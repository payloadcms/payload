import React from 'react'

import type { RichTextField } from 'payload/types'
import type { RichTextAdapter } from './types'
const RichText: React.FC<RichTextField> = (fieldprops) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = fieldprops.editor
  const { FieldComponent } = editor

  return <FieldComponent {...fieldprops} />
}

export default RichText
