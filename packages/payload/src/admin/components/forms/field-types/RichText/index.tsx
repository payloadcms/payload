import React, { useMemo } from 'react'

import type { RichTextField } from '../../../../../fields/config/types'
import type { RichTextAdapter } from './types'
const RichText: React.FC<RichTextField> = (fieldprops) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = fieldprops.editor

  const FieldComponent: React.FC<any> = useMemo(() => {
    return editor.FieldComponent()
  }, [editor, fieldprops])

  return <FieldComponent {...fieldprops} />
}

export default RichText
