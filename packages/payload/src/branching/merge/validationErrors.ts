import { getTranslation } from '@payloadcms/translations'

import type { PayloadRequest } from '../../types/index.js'
import type { BranchMergeValidationError } from '../validation.js'

import { ValidationError } from '../../errors/ValidationError.js'

export type MergeWriteValidationError = {
  changeID?: number | string
} & Omit<BranchMergeValidationError, 'changeID'>

type MergeValidationContext = Pick<
  BranchMergeValidationError,
  'changeID' | 'collectionSlug' | 'docID' | 'globalSlug'
>

const validationContexts = new WeakMap<ValidationError, MergeValidationContext>()

/** Retain the source change without replacing the error or changing Local API error behavior. */
export const setMergeValidationErrorContext = ({
  change,
  error,
}: {
  change: MergeValidationContext | undefined
  error: unknown
}): unknown => {
  if (change && error instanceof ValidationError && !validationContexts.has(error)) {
    validationContexts.set(error, change)
  }

  return error
}

export const getMergeValidationErrors = ({
  error,
  req,
}: {
  error: ValidationError
  req: PayloadRequest
}): MergeWriteValidationError[] => {
  const change = validationContexts.get(error)
  const hasErrorEntity = Boolean(error.data.collection || error.data.global)
  const collectionSlug = hasErrorEntity ? error.data.collection : change?.collectionSlug
  const globalSlug = hasErrorEntity ? error.data.global : change?.globalSlug
  const errorDocID =
    'id' in error.data && (typeof error.data.id === 'number' || typeof error.data.id === 'string')
      ? error.data.id
      : undefined
  const isSourceEntity =
    collectionSlug === change?.collectionSlug &&
    globalSlug === change?.globalSlug &&
    (errorDocID === undefined || String(errorDocID) === String(change?.docID))

  return error.data.errors.map((fieldError) => ({
    changeID: isSourceEntity ? change?.changeID : undefined,
    collectionSlug,
    docID: collectionSlug
      ? (errorDocID ?? (isSourceEntity ? change?.docID : undefined))
      : undefined,
    globalSlug,
    label: fieldError.label ? getTranslation(fieldError.label, req.i18n) : undefined,
    locale: fieldError.locale,
    message: fieldError.message,
    path: fieldError.path,
  }))
}
