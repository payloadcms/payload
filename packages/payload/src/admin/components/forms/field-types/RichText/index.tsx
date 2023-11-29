import React from 'react'

import type { RichTextField as RichTextField2 } from '../../../../../fields/config/types'

const RichText: React.FC<RichTextField2> = (fieldprops) => {
  const { editor } = fieldprops

  // Using an HOC fixes the following issue: https://github.com/payloadcms/payload/issues/4282
  // which can happen when two RichText fields are using the same FieldComponent due to a shared editorConfig() result value.
  const HOCFieldComponent: React.FC<any> = (props) => {
    return <editor.FieldComponent {...props} />
  }

  return <HOCFieldComponent {...fieldprops} />
}

export default RichText
