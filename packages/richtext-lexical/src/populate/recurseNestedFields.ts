import type { RequestContext } from 'payload'
import type { Field, PayloadRequest } from 'payload/types'

import { afterReadTraverseFields } from 'payload/utilities'

import type { PopulationPromise } from '../field/features/types'

type NestedRichTextFieldsArgs = {
  context: RequestContext
  currentDepth?: number
  data: unknown
  depth: number
  draft: boolean
  /**
   * This maps all the population promises to the node types
   */
  editorPopulationPromises: Map<string, Array<PopulationPromise>>
  fields: Field[]
  findMany: boolean
  flattenLocales: boolean
  overrideAccess: boolean
  populationPromises: Promise<void>[]
  promises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: Record<string, unknown>
}

export const recurseNestedFields = ({
  context,
  currentDepth = 0,
  data,
  depth,
  draft,
  fields,
  findMany,
  flattenLocales,
  overrideAccess = false,
  populationPromises,
  promises,
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
    draft,
    fallbackLocale: req.fallbackLocale,
    fieldPromises: promises, // Not sure if what I pass in here makes sense. But it doesn't seem like it's used at all anyways
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
    triggerAccessControl: false, // TODO: Enable this to support access control
    triggerHooks: false, // TODO: Enable this to support hooks
  })
}
