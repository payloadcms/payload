import type { Document, PayloadRequest } from '../../types/index.js'
import type { PlannedTransformerPipeline } from '../transformers/planTransformerPipeline.js'

import { planTransformerPipeline } from '../transformers/planTransformerPipeline.js'
import { getTransformKeyCoverageErrors } from './getTransformKeyCoverageErrors.js'

/**
 * Plans the request stages that apply the saved `_transforms` to a default file with no stored
 * object, and checks that they cover every saved key. A save uses it to decide that the default
 * file can be built at request time, and a request uses it to build that file. Both must use the
 * same rule, or a document saved with no stored default could fail on every request.
 */
export async function planPersistedDefaultStages({
  collectionSlug,
  doc,
  documentID,
  mimeType,
  req,
  transforms,
}: {
  collectionSlug: string
  /** The read-only document that planning sees, as both `doc` and `originalDoc`. */
  doc: Readonly<Document>
  documentID?: number | string
  mimeType: string
  req: PayloadRequest
  transforms: Document['_transforms']
}): Promise<{
  coverageErrors: { message: string; path: string }[]
  plan: PlannedTransformerPipeline
}> {
  const plan = await planTransformerPipeline({
    args: {
      collectionSlug,
      doc,
      documentID,
      mimeType,
      operation: 'request',
      originalDoc: doc,
      purpose: 'persisted-default',
      req,
    },
    capability: 'handleRequest',
    transformers: req.payload.config.upload?.transformers ?? [],
  })

  return {
    coverageErrors: getTransformKeyCoverageErrors({ claims: plan.claims, transforms }),
    plan,
  }
}
