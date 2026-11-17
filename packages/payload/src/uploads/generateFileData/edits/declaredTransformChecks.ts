import type { Document, PayloadRequest } from '../../../types/index.js'

import { ValidationError } from '../../../errors/ValidationError.js'
import { getChangedTransformKeys } from '../../transformState/getChangedTransformKeys.js'
import { getTransformDefinitionError } from '../../transformState/validateTransformState.js'

type CheckArgs = {
  /** The transformer `doc`. */
  doc: Document
  /** The frozen transformer `originalDoc`: the doc before any stage ran. */
  originalDoc: Readonly<Document>
}

/**
 * The `validate` checks of the declared `_transforms` keys in one upload. `validate` sees the doc
 * as the stages do, with the incoming file's name, size and MIME type, so neither check runs
 * before the file is known.
 *
 * - `checkSupplied`: a supplied `_transforms` replaces the stored value, so each declared key in
 *   it is checked, changed or not. It runs once: before the stages, or, when no file is read,
 *   when the result is assembled. An update without `_transforms` keeps the stored value.
 * - `checkStageChanges`: a stage can change a declared key, so that key is checked again on the
 *   final value. Files are written later in the operation, so this still runs before storage work.
 */
export function createDeclaredTransformChecks({
  collectionSlug,
  isSupplied,
  req,
}: {
  collectionSlug: string
  /** Whether the operation data has a `_transforms` value. */
  isSupplied: boolean
  req: PayloadRequest
}): {
  checkStageChanges: (args: CheckArgs) => Promise<void>
  checkSupplied: (args: CheckArgs) => Promise<void>
} {
  const hasValidators = hasTransformValidators({ req })
  let hasCheckedSupplied = !hasValidators || !isSupplied

  return {
    checkStageChanges: async ({ doc, originalDoc }) => {
      const keys = hasValidators
        ? getChangedTransformKeys({ next: doc._transforms, previous: originalDoc._transforms })
        : []

      if (keys.length > 0) {
        await assertDeclaredTransformsValid({ collectionSlug, doc, keys, originalDoc, req })
      }
    },
    checkSupplied: async ({ doc, originalDoc }) => {
      if (hasCheckedSupplied) {
        return
      }

      hasCheckedSupplied = true
      await assertDeclaredTransformsValid({ collectionSlug, doc, originalDoc, req })
    },
  }
}

/** Runs the `validate` of the declared keys in `doc._transforms`, and throws for the first error. */
async function assertDeclaredTransformsValid({
  collectionSlug,
  doc,
  keys,
  originalDoc,
  req,
}: {
  collectionSlug: string
  keys?: string[]
  req: PayloadRequest
} & CheckArgs): Promise<void> {
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
const hasTransformValidators = ({ req }: { req: PayloadRequest }): boolean =>
  Boolean(
    req.payload.config.upload?.transformers?.some(({ transformDefinitions }) =>
      transformDefinitions?.some(({ validate }) => validate),
    ),
  )
