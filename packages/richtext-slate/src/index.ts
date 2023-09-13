import type { RichTextAdapter } from 'payload/types'

import type { AdapterArguments } from './types'

import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { getSlateCellComponent } from './getSlateCellComponent'
import { getSlateFieldComponent } from './getSlateFieldComponent'

export function createSlate(args: AdapterArguments): RichTextAdapter<AdapterArguments> {
  return {
    CellComponent: getSlateCellComponent(args),
    FieldComponent: getSlateFieldComponent(args),
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
  }
}
