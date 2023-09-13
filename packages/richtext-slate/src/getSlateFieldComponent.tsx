import { deepMerge } from 'payload/utilities'
import React from 'react'

import type { AdapterArguments, FieldProps } from './types'

import RichTextField from './field'

export function getSlateFieldComponent(args: AdapterArguments): React.FC<FieldProps> {
  // A wrapper around the RichTextField to inject the AdapterArguments as props
  const RichTextFieldWithProps: React.FC<FieldProps> = (fieldProps) => {
    const mergedProps = deepMerge(fieldProps, args)
    return <RichTextField {...mergedProps} />
  }
  return RichTextFieldWithProps
}
