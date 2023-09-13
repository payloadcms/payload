import React from 'react'

import type { RichTextField } from '../../../../../../../../exports/types'
import type { CellComponentProps } from '../../types'

const RichTextCell: React.FC<CellComponentProps<RichTextField>> = (props) => {
  return <props.field.editor.CellComponent {...props} />
}

export default RichTextCell
