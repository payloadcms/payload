import type { Document, PayloadRequest } from '../../../types/index.js'

import { ValidationError } from '../../../errors/ValidationError.js'
import { getTransformDefinitionError } from '../../transformState/validateTransformState.js'

/** Runs the `validate` of the declared keys in `doc._transforms`, and throws for the first error. */
export async function assertDeclaredTransformsValid({
  collectionSlug,
  doc,
  keys,
  originalDoc,
  req,
}: {
  collectionSlug: string
  doc: Document
  keys?: string[]
  originalDoc: Readonly<Document>
  req: PayloadRequest
}): Promise<void> {
  const error = await getTransformDefinitionError({
    collectionSlug,
    doc,
    keys,
    originalDoc,
    req,
    transforms: doc._transforms,
  })

  if (error) {
    throw new ValidationError({ collection: collectionSlug, errors: [error], req }, req.t)
  }
}

/** Whether a configured transformer declares a `_transforms` key with a `validate`. */
export const hasTransformValidators = ({ req }: { req: PayloadRequest }): boolean =>
  Boolean(
    req.payload.config.upload?.transformers?.some(({ transformDefinitions }) =>
      transformDefinitions?.some(({ validate }) => validate),
    ),
  )
