import React from 'react'

import type { RichTextField } from '../../../../../../../../fields/config/types'
import type { RichTextAdapter } from '../../../../../../forms/field-types/RichText/types'
import type { CellComponentProps } from '../../types'

const RichTextCell: React.FC<CellComponentProps<RichTextField>> = (props) => {
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = props.field.editor

  return <editor.CellComponent {...props} />
}

export default RichTextCell
