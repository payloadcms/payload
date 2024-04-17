import type { SerializedEditorState } from 'lexical'
import type { PayloadRequest } from 'payload/types'
import type { Collection, Field, RichTextField } from 'payload/types'

import type { AdapterProps } from '../types.js'

type Arguments = {
  currentDepth?: number
  data: unknown
  depth: number
  field: RichTextField<SerializedEditorState, AdapterProps>
  key: number | string
  overrideAccess?: boolean
  req: PayloadRequest
  showHiddenFields: boolean
}

export const populate = async ({
  id,
  collection,
  currentDepth,
  data,
  depth,
  key,
  overrideAccess,
  req,
  showHiddenFields,
}: Omit<Arguments, 'field'> & {
  collection: Collection
  field: Field
  id: number | string
}): Promise<void> => {
  const dataRef = data as Record<string, unknown>

  const doc = await req.payloadDataLoader.load(
    JSON.stringify([
      req.transactionID,
      collection.config.slug,
      id,
      depth,
      currentDepth + 1,
      req.locale,
      req.fallbackLocale,
      typeof overrideAccess === 'undefined' ? false : overrideAccess,
      showHiddenFields,
    ]),
  )

  if (doc) {
    dataRef[key] = doc
  } else {
    dataRef[key] = null
  }
}
