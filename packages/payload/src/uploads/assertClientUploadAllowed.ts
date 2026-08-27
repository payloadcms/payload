import { APIError } from '../errors/APIError.js'
import {
  getSanitizedUploadFilename,
  uploadRequiresServerValidation,
} from './getFileTypeIdentity.js'

const MIME_TYPE_PATTERN = /^[!#$%&'*+.^`|~\w-]+\/[!#$%&'*+.^`|~\w-]+$/

const isValidMimeType = (mimeType: unknown): mimeType is string => {
  if (
    typeof mimeType !== 'string' ||
    mimeType.length === 0 ||
    mimeType !== mimeType.trim() ||
    [...mimeType].some((character) => {
      const codePoint = character.codePointAt(0)
      return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)
    })
  ) {
    return false
  }

  const [essence, ...parameters] = mimeType.split(';')
  return (
    MIME_TYPE_PATTERN.test(essence ?? '') &&
    parameters.every((parameter) => parameter.trim().length > 0)
  )
}

export const assertClientUploadFileSize = (filesize: unknown): asserts filesize is number => {
  if (typeof filesize !== 'number' || !Number.isSafeInteger(filesize) || filesize < 0) {
    throw new APIError('A valid file size is required for client uploads.', 400)
  }
}

export const assertClientUploadAllowed = ({
  collection,
  filename,
  mimeType,
}: {
  collection?: {
    upload?: { allowRestrictedFileTypes?: boolean } | boolean
  }
  filename: unknown
  mimeType?: unknown
}): void => {
  if (
    typeof filename !== 'string' ||
    filename.length === 0 ||
    filename.trim().length === 0 ||
    !getSanitizedUploadFilename(filename)
  ) {
    throw new APIError('A valid filename is required for client uploads.', 400)
  }

  const allowRestrictedFileTypes =
    collection && typeof collection.upload === 'object'
      ? collection.upload.allowRestrictedFileTypes
      : false

  // The explicit restricted-file opt-out also preserves legacy provider clients that did not
  // send MIME metadata. Secure-default collections always require a bindable MIME identity.
  if (mimeType === undefined || mimeType === null || mimeType === '') {
    if (allowRestrictedFileTypes) {
      return
    }
    throw new APIError('A valid MIME type is required for client uploads.', 400)
  }

  if (!isValidMimeType(mimeType)) {
    throw new APIError('A valid MIME type is required for client uploads.', 400)
  }

  if (uploadRequiresServerValidation({ allowRestrictedFileTypes, filename, mimeType })) {
    throw new APIError('SVG and XML files must be uploaded through Payload.', 400)
  }
}
