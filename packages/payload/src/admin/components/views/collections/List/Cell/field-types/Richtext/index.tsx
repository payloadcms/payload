import React from 'react'

import type { RichTextField } from '../../../../../../../../fields/config/types'
import type { RichTextAdapter } from '../../../../../../forms/field-types/RichText/types'
import type { CellComponentProps } from '../../types'

import { useConfig } from '../../../../../../utilities/Config'

const RichTextCell: React.FC<CellComponentProps<RichTextField>> = (props) => {
  const config = useConfig()
  // eslint-disable-next-line react/destructuring-assignment
  const editor: RichTextAdapter = props.field.editor || config.defaultEditor

  return <editor.CellComponent {...props} />
}

export default RichTextCell
