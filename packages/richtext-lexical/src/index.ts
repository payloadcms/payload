import type { RichTextAdapter } from 'payload/types'

import { withMergedProps } from 'payload/components/utilities'

import type { AdapterArguments } from './types'

import RichTextCell from './cell'
import RichTextField from './field'

export function createLexical(args: AdapterArguments): RichTextAdapter<AdapterArguments> {
  return {
    CellComponent: withMergedProps({
      Component: RichTextCell,
      toMergeIntoProps: args,
    }),
    FieldComponent: withMergedProps({
      Component: RichTextField,
      toMergeIntoProps: args,
    }),
    afterReadPromise({
      currentDepth,
      depth,
      field,
      overrideAccess,
      req,
      showHiddenFields,
      siblingDoc,
    }) {
      return null
    },
  }
}
