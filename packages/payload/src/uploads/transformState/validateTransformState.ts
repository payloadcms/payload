import type { ValidationFieldError } from '../../errors/ValidationError.js'
import type { Document, PayloadRequest } from '../../types/index.js'

import { ValidationError } from '../../errors/ValidationError.js'
import {
  imageEncodingSchema,
  pdfEncodingSchema,
  transformStateSchema,
  videoEncodingSchema,
} from './transformStateSchema.js'

/**
 * Validate shared shapes before execution. MIME-specific encoding is checked only
 * at the final representation boundary, after converters have selected its format.
 */
export function validateTransformState({
  collectionSlug,
  doc,
  req,
  shouldValidateEncoding = false,
  value,
}: {
  collectionSlug?: string
  doc?: Document
  req?: PayloadRequest
  shouldValidateEncoding?: boolean
  value: unknown
}): void {
  const errors = getTransformStateErrors({ doc, shouldValidateEncoding, value })

  if (errors.length) {
    throw new ValidationError({ collection: collectionSlug, errors, req }, req?.t)
  }
}

export function getTransformStateErrors({
  doc,
  shouldValidateEncoding = true,
  value,
}: {
  doc?: Document
  shouldValidateEncoding?: boolean
  value: unknown
}): ValidationFieldError[] {
  if (value === undefined || value === null) {
    return []
  }

  const errors = getJSONErrors({ path: '_transforms', value })

  if (errors.length) {
    return errors
  }

  const parsed = transformStateSchema.safeParse(value)

  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      message: issue.message,
      path: ['_transforms', ...issue.path].join('.'),
    }))
  }

  const state = parsed.data!
  const source = doc?.original ?? doc
  const addError = (path: string, message: string) =>
    errors.push({ message, path: `_transforms.${path}` })

  if (state.crop) {
    if (typeof source?.width === 'number' && state.crop.x + state.crop.width > source.width) {
      addError('crop.width', 'Crop exceeds the original width.')
    }
    if (typeof source?.height === 'number' && state.crop.y + state.crop.height > source.height) {
      addError('crop.height', 'Crop exceeds the original height.')
    }
  }
  if (state.resize && state.resize.width === undefined && state.resize.height === undefined) {
    addError('resize', 'At least one target dimension is required.')
  }
  if (state.flip && !state.flip.horizontal && !state.flip.vertical) {
    addError('flip', 'At least one mirror axis must be enabled.')
  }
  if (state.clip && state.clip.endMs <= state.clip.startMs) {
    addError('clip.endMs', 'Clip end must follow its start.')
  }
  if (state.pageRange && state.pageRange.endPage < state.pageRange.startPage) {
    addError('pageRange.endPage', 'Page range end must not precede its start.')
  }

  if (shouldValidateEncoding && state.encoding && typeof doc?.mimeType === 'string') {
    const schema = doc.mimeType.startsWith('image/')
      ? imageEncodingSchema
      : doc.mimeType.startsWith('video/')
        ? videoEncodingSchema
        : doc.mimeType === 'application/pdf'
          ? pdfEncodingSchema
          : undefined

    if (!schema?.safeParse(state.encoding).success) {
      addError('encoding', 'Encoding options do not match the resolved representation MIME type.')
    }
  }

  return errors
}

function getJSONErrors({
  path,
  seen = new Set(),
  value,
}: {
  path: string
  seen?: Set<object>
  value: unknown
}): ValidationFieldError[] {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return []
  }

  if (
    typeof value !== 'object' ||
    seen.has(value) ||
    Object.getOwnPropertySymbols(value).length > 0 ||
    (Array.isArray(value) &&
      (Object.keys(value).length !== value.length ||
        Object.keys(value).some((key, index) => key !== String(index)))) ||
    (!Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    return [{ message: 'Transform values must be JSON serializable.', path }]
  }

  seen.add(value)
  const errors = Object.entries(value).flatMap(([key, child]) =>
    getJSONErrors({ path: `${path}.${key}`, seen, value: child }),
  )
  seen.delete(value)

  return errors
}
