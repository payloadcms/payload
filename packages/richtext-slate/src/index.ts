import type { RichTextAdapter } from 'payload/types'

import type { AdapterArguments } from './types'

import { richTextRelationshipPromise } from './data/richTextRelationshipPromise'
import { getSlateComponent } from './getSlateComponent'

export function createSlate(args: AdapterArguments): RichTextAdapter<AdapterArguments> {
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
    component: getSlateComponent(args),
  }
}
