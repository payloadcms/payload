import type { Field, JsonObject, PayloadRequest, RequestContext } from 'payload'

import { afterReadTraverseFields } from 'payload'

import type { PopulationPromise } from '../features/typesServer.js'

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
  /**
   * fieldPromises are used for things like field hooks. They should be awaited before awaiting populationPromises
   */
  fieldPromises: Promise<void>[]
  fields: Field[]
  findMany: boolean
  flattenLocales: boolean
  overrideAccess: boolean
  parentIsLocalized: boolean
  populationPromises: Promise<void>[]
  req: PayloadRequest
  showHiddenFields: boolean
  siblingDoc: JsonObject
}

export const recursivelyPopulateFieldsForGraphQL = ({
  context,
  currentDepth = 0,
  data,
  depth,
  draft,
  fieldPromises,
  fields,
  findMany,
  flattenLocales,
  overrideAccess = false,
  parentIsLocalized,
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
    draft,
    fallbackLocale: req.fallbackLocale!,
    fieldPromises,
    fields,
    findMany,
    flattenLocales,
    global: null, // Pass from core? This is only needed for hooks, so we can leave this null for now
    locale: req.locale!,
    overrideAccess,
    parentIndexPath: '',
    parentIsLocalized,
    parentPath: '',
    parentSchemaPath: '',
    populationPromises, // This is not the same as populationPromises passed into this recurseNestedFields. These are just promises resolved at the very end.
    req,
    showHiddenFields,
    siblingDoc,
    triggerHooks: false,
  })
}
