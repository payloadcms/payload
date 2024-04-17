import type { RequestContext } from 'payload'
import type { Field, PayloadRequest } from 'payload/types'

import { afterReadTraverseFields } from 'payload/utilities'

import type { PopulationPromise } from '../field/features/types.js'

type NestedRichTextFieldsArgs = {
  context: RequestContext
  currentDepth?: number
  data: unknown
  depth: number
  /**
   * This maps all the population promises to the node types
   */
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
  /**
   * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
   */
  fieldPromises: Promise<void>[]
  fields: Field[]
  findMany: boolean
  flattenLocales: boolean
  overrideAccess: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}

export const recurseNestedFields = ({
  context,
  currentDepth = 0,
  data,
  depth,
  fieldPromises,
  fields,
  findMany,
  flattenLocales,
  overrideAccess = false,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc,
}: NestedRichTextFieldsArgs): void => {
  afterReadTraverseFields({
    collection: null, // Pass from core? This is only needed for hooks, so we can leave this null for now
    context,
    currentDepth,
    depth,
    doc: data as any, // Looks like it's only needed for hooks and access control, so doesn't matter what we pass here right now
    fallbackLocale: req.fallbackLocale,
    fieldPromises,
    fields,
    findMany,
    flattenLocales,
    global: null, // Pass from core? This is only needed for hooks, so we can leave this null for now
    locale: req.locale,
    overrideAccess,
    populationPromises, // This is not the same as populationPromises passed into this recurseNestedFields. These are just promises resolved at the very end.
    req,
    showHiddenFields,
    siblingDoc,
    //triggerAccessControl: false, // TODO: Enable this to support access control
    //triggerHooks: false, // TODO: Enable this to support hooks
  })
}
