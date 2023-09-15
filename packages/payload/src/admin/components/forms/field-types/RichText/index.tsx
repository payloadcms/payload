import React from 'react'

import type { RichTextField } from '../../../../../fields/config/types'
import type { RichTextAdapter } from './types'

import { useConfig } from '../../../utilities/Config'

const RichText: React.FC<RichTextField> = (props) => {
  const config = useConfig()
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = props.editor || config.defaultEditor
  return <editor.FieldComponent {...props} />
}

export default RichText
