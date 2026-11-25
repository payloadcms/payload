import type { ReservedObject } from './types.js'

import { APIError } from '../../errors/APIError.js'

/**
 * Adapters that cannot list in-progress uploads stage segments as separate objects under this
 * prefix, then assemble them at the final path on completion. Keeping them apart means a signed
 * segment URL can never write the stored file.
 */
export const UPLOAD_STAGING_PREFIX = 'payload-upload-sessions/'

/** Fits every provider's maximum segment count, so staged parts sort and parse by name. */
const STAGED_PART_NUMBER_DIGITS = 5

const MAXIMUM_STAGED_PART_NUMBER = 10 ** STAGED_PART_NUMBER_DIGITS - 1

/**
 * Builds the `ReservedObject` of an upload session from what `resolveSignedURLKey` resolved for
 * its upload.
 */
export const toReservedObject = ({
  sanitizedFilename,
  storageFilePath,
  uploadReference,
}: {
  sanitizedFilename: string
  storageFilePath: string
  uploadReference: { _objectKey?: string; prefix: string }
}): ReservedObject => {
  if (!uploadReference._objectKey) {
    throw new Error('Upload session storage could not be reserved.')
  }

  return {
    _objectKey: uploadReference._objectKey,
    filename: sanitizedFilename,
    prefix: uploadReference.prefix,
    storageFilePath,
  }
}

/** Where an object's staged data lives: a single staging object, or the folder of its parts. */
export const getUploadStagingPath = ({ object }: { object: ReservedObject }): string =>
  `${UPLOAD_STAGING_PREFIX}${object.storageFilePath}`

export const getStagedPartPath = ({
  number,
  object,
}: {
  number: number
  object: ReservedObject
}): string => {
  if (!Number.isSafeInteger(number) || number < 1 || number > MAXIMUM_STAGED_PART_NUMBER) {
    throw new Error(`Segment ${number} cannot be staged.`)
  }

  return `${getUploadStagingPath({ object })}/${String(number).padStart(STAGED_PART_NUMBER_DIGITS, '0')}`
}

/** The segment number of a staged part, or `null` for any other path. */
export const getStagedPartNumber = ({
  object,
  path,
}: {
  object: ReservedObject
  path: string
}): null | number => {
  const partsPrefix = `${getUploadStagingPath({ object })}/`

  if (!path.startsWith(partsPrefix)) {
    return null
  }

  const name = path.slice(partsPrefix.length)

  return name.length === STAGED_PART_NUMBER_DIGITS && /^\d+$/.test(name) && Number(name) > 0
    ? Number(name)
    : null
}

/**
 * Converts storage faults a retry cannot fix (a missing bucket, denied access) into a 4xx
 * `APIError`, so core marks the session failed instead of retrying it until it expires.
 */
export const withPermanentStorageErrors = async <T>({
  getPermanentStatus,
  getReason = getErrorName,
  operation,
}: {
  /** The 4xx status of a fault a retry cannot fix, or `null` to rethrow the error unchanged. */
  getPermanentStatus: (err: unknown) => null | number
  /** Names the fault in the error message. Defaults to the error's name, or its class. */
  getReason?: (err: unknown) => string
  operation: () => Promise<T>
}): Promise<T> => {
  try {
    return await operation()
  } catch (err) {
    const status = getPermanentStatus(err)

    if (status) {
      throw new APIError(`Storage rejected the upload (${getReason(err)}).`, status)
    }

    throw err
  }
}

/** Some SDKs leave `name` as the generic `Error`, so their class names the fault instead. */
const getErrorName = (err: unknown): string => {
  if (!(err instanceof Error)) {
    return 'Error'
  }

  return err.name !== 'Error' ? err.name : err.constructor.name
}

/**
 * Maps items with bounded concurrency. After the first failure no new items start, and running
 * ones finish before the failure is thrown, so nothing keeps writing to storage once it failed.
 */
export const mapWithConcurrency = async <T, R>({
  concurrency,
  items,
  mapper,
}: {
  concurrency: number
  items: T[]
  mapper: (item: T) => Promise<R>
}): Promise<R[]> => {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  let failure: { err: unknown } | undefined

  const worker = async () => {
    while (!failure && nextIndex < items.length) {
      const index = nextIndex++

      try {
        results[index] = await mapper(items[index]!)
      } catch (err) {
        failure ??= { err }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))

  if (failure) {
    throw failure.err
  }

  return results
}
