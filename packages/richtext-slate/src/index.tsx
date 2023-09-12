import type { RichTextAdapter } from 'payload/types'

import { deepMerge } from 'payload/utilities'
import React from 'react'

import type { AdapterArguments } from './types'

import richTextRelationshipPromise from './data/richTextRelationshipPromise'
import RichTextField from './field'

export function createSlate(args: AdapterArguments): RichTextAdapter<AdapterArguments> {
  // A wrapper around the RichTextField to inject the AdapterArguments as props
  const RichTextFieldWithProps: React.FC<any> = (fieldProps) => {
    const mergedProps = deepMerge(fieldProps, args)
    return <RichTextField {...mergedProps} />
  }

  return {
    afterReadPromise({
      currentDepth,
      depth,
      field,
      overrideAccess,
      req,
      showHiddenFields,
      siblingDoc,
    }) {
      if (
        field.admin?.elements?.includes('relationship') ||
        field.admin?.elements?.includes('upload') ||
        field.admin?.elements?.includes('link') ||
        !field?.admin?.elements
      ) {
        return richTextRelationshipPromise({
          currentDepth,
          depth,
          field,
          overrideAccess,
          req,
          showHiddenFields,
          siblingDoc,
        })
      }
      return null
    },
    component: RichTextFieldWithProps,
  }
}
