import React from 'react'

import type { RichTextField } from '../../../../../fields/config/types'
import type { RichTextAdapter } from './types'
const RichText: React.FC<RichTextField> = (fieldprops) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = fieldprops.editor

  // Using an HOC fixes the following issue: https://github.com/payloadcms/payload/issues/4282
  // which can happen when two RichText fields are using the same FieldComponent due to a shared editorConfig() result value.
  const HOCFieldComponent: React.FC<any> = (props) => {
    return <editor.FieldComponent {...props} />
  }

  return <HOCFieldComponent {...fieldprops} />
}

export default RichText
