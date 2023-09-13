import type { CellComponentProps, RichTextField } from 'payload/types'

import { deepMerge } from 'payload/utilities'
import React from 'react'

import type { AdapterArguments } from './types'

import RichTextCell from './cell'

export function getSlateCellComponent(
  args: AdapterArguments,
): React.FC<CellComponentProps<RichTextField<AdapterArguments>>> {
  // A wrapper around the RichTextField to inject the AdapterArguments as props
  const RichTextCellWithProps: React.FC<CellComponentProps<RichTextField<AdapterArguments>>> = (
    fieldProps,
  ) => {
    const mergedProps = deepMerge(fieldProps, args)
    return <RichTextCell {...mergedProps} />
  }
  return RichTextCellWithProps
}
