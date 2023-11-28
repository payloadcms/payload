import type { Field, PayloadRequest } from 'payload/types'

import { afterReadTraverseFields } from 'payload/utilities'

import type { PopulationPromise } from '../field/features/types'

type NestedRichTextFieldsArgs = {
  currentDepth?: number
  data: unknown
  depth: number
  fields: Field[]
  overrideAccess: boolean
  populationPromises: Map<string, Array<PopulationPromise>>
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}

export const recurseNestedFields = ({
  currentDepth = 0,
  data,
  depth,
  fields,
  overrideAccess = false,
  populationPromises,
  promises,
  req,
  showHiddenFields,
  siblingDoc,
}: NestedRichTextFieldsArgs): void => {
  afterReadTraverseFields({
    collection: null,
    context: {},
    currentDepth,
    depth,
    doc: data as any,
    fieldPromises: promises,
    fields,
    findMany: false,
    flattenLocales: false,
    global: null,
    overrideAccess,
    populationPromises: [], // TODO: idk what this is
    req,
    showHiddenFields,
    siblingDoc,
    triggerAccessControl: false,
    triggerHooks: false,
  })
}
