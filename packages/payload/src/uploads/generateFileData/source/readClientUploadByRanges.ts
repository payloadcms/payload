import { fileTypeFromBuffer } from 'file-type'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { FileSource } from '../../transformers/types.js'
import type { UploadStages } from '../plan/planUploadStages.js'

import { canCheckContentsByRanges } from '../../canCheckContentsByRanges.js'
import { checkFileRestrictions } from '../../checkFileRestrictions.js'
import { hasMimeTypeAllowList } from '../../getFileContentRequirement.js'
import { hasFullFileContents } from '../../hasFullFileContents.js'
import {
  isISOBaseMediaMimeType,
  validateISOBaseMediaSource,
} from '../../validateISOBaseMediaFile.js'
import { createClientUploadFileSource } from './createClientUploadFileSource.js'

type IncomingFile = NonNullable<PayloadRequest['file']>

/** The bytes `file-type` reads to find most types: its `reasonableDetectionSizeInBytes`. */
const FILE_TYPE_SAMPLE_BYTE_LENGTH = 4100

/**
 * The most box header reads the ranged ISO base media check makes. Each read is a storage
 * request. A file with more top-level boxes, such as a fragmented MP4, is downloaded instead.
 */
const MAX_BOX_HEADER_READS = 32

/**
 * True when the content checks of a client upload that arrived without its whole contents were
 * not run yet, because its collection has a MIME type allow-list and the checks can run over byte
 * ranges (see getFileContentRequirement.ts). They then run over ranges, or after a download when
 * a stage needs the whole file.
 */
export function hasDeferredContentChecks({
  collection,
  file,
}: {
  collection: SanitizedCollectionConfig
  file: IncomingFile
}): boolean {
  return canReadByRanges({ file }) && hasMimeTypeAllowList({ uploadConfig: collection.upload })
}

/**
 * True when a client upload that arrived without its whole contents is read by byte ranges: no
 * main-file stage or upload bridge needs the whole file, and a hook owner reads it or its
 * collection's allow-list check runs over ranges.
 */
export function shouldReadClientUploadByRanges({
  collection,
  file,
  stages,
}: {
  collection: SanitizedCollectionConfig
  file: IncomingFile
  stages: Pick<UploadStages, 'bridgeTransformer' | 'hookOwners' | 'pipeline'>
}): boolean {
  return (
    canReadByRanges({ file }) &&
    stages.pipeline.length === 0 &&
    !stages.bridgeTransformer &&
    (stages.hookOwners.length > 0 || hasMimeTypeAllowList({ uploadConfig: collection.upload }))
  )
}

/**
 * The ranged source of a client upload, after the content checks that the full download would
 * run: the type and allow-list check on the first bytes, and the ISO base media box check over
 * ranges. An invalid file fails with the same error as after a download. Undefined when the checks
 * need the whole file: the first bytes are not a type these checks cover, or the box check needs
 * too many reads. The caller then downloads the file.
 */
export async function getCheckedClientUploadSource({
  collection,
  file,
  req,
}: {
  collection: SanitizedCollectionConfig
  file: IncomingFile
  req: PayloadRequest
}): Promise<FileSource | undefined> {
  const fileSource = createClientUploadFileSource({ collectionSlug: collection.slug, file, req })
  const firstBytes = Buffer.from(
    await fileSource.readFileBytes({
      numberOfBytes: FILE_TYPE_SAMPLE_BYTE_LENGTH,
      startByte: 0,
    }),
  )
  const detected = await fileTypeFromBuffer(firstBytes)

  // Only these types are checked the same way from their first bytes as from the whole file.
  if (!detected || !canCheckContentsByRanges({ filename: file.name, mimeType: detected.mime })) {
    return undefined
  }

  const boxCheck = isISOBaseMediaMimeType(detected.mime)
    ? await validateISOBaseMediaSource({ fileSource, maxReads: MAX_BOX_HEADER_READS })
    : undefined

  if (boxCheck === 'tooManyReads') {
    return undefined
  }

  await checkFileRestrictions({
    collection,
    file: { ...file, data: firstBytes },
    hasValidISOBaseMediaBoxes: boxCheck === undefined ? undefined : boxCheck === 'valid',
    req,
  })

  return fileSource
}

/** A client upload in storage, without its whole contents, of a type checked over ranges. */
function canReadByRanges({ file }: { file: IncomingFile }): boolean {
  const { uploadReference } = file
  // A staged upload's `uploadId` points to a temp file Payload stored, not to storage.
  const isStoredByProvider =
    typeof uploadReference === 'object' &&
    uploadReference !== null &&
    !('uploadId' in uploadReference)

  return (
    isStoredByProvider &&
    !hasFullFileContents(file) &&
    canCheckContentsByRanges({ filename: file.name, mimeType: file.mimetype })
  )
}
