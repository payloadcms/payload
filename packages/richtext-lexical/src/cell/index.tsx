import type { CellComponentProps, RichTextField } from 'payload/types'

import React from 'react'

import type { AdapterArguments } from '../types'

const RichTextCell: React.FC<CellComponentProps<RichTextField<AdapterArguments>, any>> = ({
  data,
}) => {
  if (data == null) {
    return <span />
  }

  return <span>{data.preview}</span>
}

export default RichTextCell
