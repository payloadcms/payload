import { deepMerge } from 'payload/utilities'
import React from 'react'

import type { AdapterArguments } from './types'

import RichTextField from './field'

export function getSlateComponent(args: AdapterArguments): React.FC<any> {
  // A wrapper around the RichTextField to inject the AdapterArguments as props
  const RichTextFieldWithProps: React.FC<any> = (fieldProps) => {
    const mergedProps = deepMerge(fieldProps, args)
    return <RichTextField {...mergedProps} />
  }
  return RichTextFieldWithProps
}
