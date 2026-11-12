import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { Document, PayloadRequest } from '../../../types/index.js'
import type { fetchFullClientUpload as downloadFullClientUpload } from '../../getFileFromUploadInstructions.js'
import type { UploadStages } from '../plan/planUploadStages.js'

import { hasFullFileContents } from '../../hasFullFileContents.js'
import { getUploadTransformerInternal } from '../../transformers/uploadTransformerBridge.js'
import { isClaimRequired } from '../../transformState/transformKeyClaims.js'
import { checkFileAndUseDetectedType } from '../utils/checkFileAndUseDetectedType.js'

type IncomingFile = NonNullable<PayloadRequest['file']>

/**
 * Whether a stage needs the bytes of a client upload that arrived with only a header probe or no
 * contents (see getFileContentRequirement.ts). The content requirement covers what Sharp's bridge
 * needs for its configuration, but not saved keys that it claims. A focal point only guides
 * sizes, which the content requirement already covers, so it needs no download.
 */
export function needsFullClientUpload({
  file,
  pipelineDoc,
  stages: { bridgeTransformer, pipeline, plan },
}: {
  file: IncomingFile
  pipelineDoc: Document
  stages: Pick<UploadStages, 'bridgeTransformer' | 'pipeline' | 'plan'>
}): boolean {
  if (hasFullFileContents(file) || !file.uploadReference) {
    return false
  }

  const bridgeClaims = bridgeTransformer ? plan.claims.get(bridgeTransformer) : undefined
  const isBridgeApplyingSavedKey =
    pipeline.length > 0 &&
    Object.keys(pipelineDoc._transforms ?? {}).some(
      (key) => isClaimRequired(key) && Boolean(bridgeClaims?.includes(key)),
    )

  return (
    isBridgeApplyingSavedKey ||
    pipeline.some((transformer) => !getUploadTransformerInternal(transformer)?.transformUpload)
  )
}

/**
 * Downloads the whole client upload and checks it again, because the first check saw only a
 * probe. Sets `req.file` to the result, so hooks, storage plugins and temp file cleanup see it.
 * Errors from the download and its checks keep their own message and status.
 */
export async function downloadClientUpload({
  collection,
  fetchFullClientUpload,
  file: probedFile,
  req,
}: {
  collection: SanitizedCollectionConfig
  fetchFullClientUpload: typeof downloadFullClientUpload
  file: IncomingFile
  req: PayloadRequest
}): Promise<{ file: IncomingFile; hasTypeChanged: boolean }> {
  const downloadedFile = await fetchFullClientUpload({
    collectionSlug: collection.slug,
    file: probedFile,
    req,
  })
  // On req.file, the temp file is removed after the operation, also when the check fails.
  req.file = downloadedFile
  const checkedFile = await checkFileAndUseDetectedType({ collection, file: downloadedFile, req })
  // Later steps change this same object, for example to drop its upload reference.
  req.file = checkedFile

  return { file: checkedFile, hasTypeChanged: checkedFile.mimetype !== probedFile.mimetype }
}
