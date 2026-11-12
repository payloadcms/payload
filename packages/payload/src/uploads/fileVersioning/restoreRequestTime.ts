import type { Document, JsonObject } from '../../types/index.js'
import type { RequestTimeBuildPlan } from '../transformState/planUpload.js'
import type { OriginalFileData } from '../types.js'
import type { FileRestoreArgs } from './restore.js'

import { APIError } from '../../errors/APIError.js'
import { ValidationError } from '../../errors/ValidationError.js'
import { deepCopyObject } from '../../utilities/deepCopyObject.js'
import { deepFreeze } from '../../utilities/deepFreeze.js'
import { generateFilePathOrURL } from '../generateFilePathOrURL.js'
import { shouldRequestOriginal } from '../isOriginalFileRequest.js'
import { isRequestTimeFile } from '../isRequestTimeFile.js'
import { getRequestTimeDefaultFileData, getRequestTimeVariants } from '../requestTimeFileData.js'
import {
  areVariantsBuildableAtRequest,
  isBuildableAtRequest,
  planRequestTimeBuild,
} from '../transformState/planUpload.js'
import { getTransformStateError } from '../transformState/validateTransformState.js'
import { collectStoredFiles, hasStoredOriginal } from './storedFiles.js'

/**
 * Restores a version that has a file built at request time, from its retained original. A restore
 * never builds new stored files. Each entry is handled on its own:
 * - A stored entry keeps its saved bytes.
 * - An entry with no stored output stays request-time, when the current configuration can build it
 *   at request time. Otherwise the restore fails before any file work.
 * - A configured size that the version did not have is added as request-time when the current
 *   configuration can build it, and is left out when it cannot.
 */
export async function runRequestTimeFileRestore<T>({
  id,
  collection,
  current,
  req,
  runStoredRestore,
  selected,
  write,
}: {
  /** Copies the stored files, writes the restored document and cleans up the replaced files. */
  runStoredRestore: (args: FileRestoreArgs<T>) => Promise<T>
} & FileRestoreArgs<T>): Promise<T> {
  const original = selected.original as OriginalFileData | undefined
  const storedFiles = collectStoredFiles({ collection, doc: selected, req })
  if (!original?.filename || !original.mimeType || !hasStoredOriginal({ storedFiles })) {
    throw new APIError('Restoring request-time files requires a retained original.', 400)
  }

  const transforms = selected._transforms
  const transformError = getTransformStateError({
    original,
    transformers: req.payload.config.upload?.transformers ?? [],
    value: transforms,
  })

  if (transformError) {
    throw new ValidationError(
      {
        collection: collection.slug,
        errors: [transformError],
        req,
      },
      req.t,
    )
  }

  const pipelineDoc = deepCopyObject({
    ...selected,
    filename: original.filename,
    filesize: original.filesize,
    mimeType: original.mimeType,
    variants: {},
  }) as Document
  const planArgs = {
    collectionSlug: collection.slug,
    documentID: id,
    mimeType: original.mimeType,
    pipelineDoc,
    pipelineOriginalDoc: deepFreeze(deepCopyObject(pipelineDoc)),
    req,
  }

  const isMainBuiltAtRequest = isRequestTimeFile({ entry: selected })
  const storedVariantNames = new Set(
    storedFiles.flatMap(({ roles }) =>
      roles.flatMap((role) => (role.type === 'size' ? [role.sizeKey] : [])),
    ),
  )
  const unstoredVariantNames = (collection.upload.variants ?? [])
    .map(({ name }) => name)
    .filter((name) => !storedVariantNames.has(name))
  const selectedVariants = (selected.variants ?? {}) as Record<string, JsonObject | null>
  const hasRequestTimeVariant = unstoredVariantNames.some((name) =>
    isRequestTimeFile({ entry: selectedVariants[name] }),
  )

  // The checks below use one plan, so the stages are planned at most once.
  let requestTimeBuild: Promise<RequestTimeBuildPlan> | undefined
  const getRequestTimeBuild = () => (requestTimeBuild ??= planRequestTimeBuild(planArgs))

  if (
    isMainBuiltAtRequest &&
    !isBuildableAtRequest({ requestTimeBuild: await getRequestTimeBuild() })
  ) {
    throw new APIError('No compatible transformer can restore the file at request time.', 400)
  }

  const canBuildVariants =
    unstoredVariantNames.length > 0 &&
    areVariantsBuildableAtRequest({
      requestTimeBuild: await getRequestTimeBuild(),
      variantsTransformerSlug: collection.upload.variantsTransformerSlug,
    })

  // A size that this version built at request time must still be buildable. A size that the version
  // did not have is left out when it cannot be built, as an upload leaves it out.
  if (hasRequestTimeVariant && !canBuildVariants) {
    throw new APIError('No compatible transformer can restore the configured file variants.', 400)
  }

  const requestTimeVariantNames = canBuildVariants ? unstoredVariantNames : []

  // Copy the stored files with storage operations. Entries built at request time read no bytes.
  return runStoredRestore({
    id,
    collection,
    current,
    req,
    selected,
    write: async (copied) => {
      const copiedOriginal = copied.original as OriginalFileData
      const copiedVariants = (copied.variants ?? {}) as Record<string, JsonObject | null>
      const requestTimeVariants =
        requestTimeVariantNames.length > 0
          ? await getRequestTimeVariants({
              collection,
              documentID: id,
              filename: isMainBuiltAtRequest ? copiedOriginal.filename : copied.filename,
              original: copiedOriginal,
              prefix: copiedOriginal.prefix,
              req,
              reservedFilenames: [...storedVariantNames].flatMap((name) => {
                const storedFilename = copiedVariants[name]?.filename
                return typeof storedFilename === 'string' ? [storedFilename] : []
              }),
              staticPath: collection.upload.disableLocalStorage
                ? undefined
                : collection.upload.staticDir,
            })
          : {}
      const restored: JsonObject = {
        ...copied,
        ...(isMainBuiltAtRequest &&
          getRequestTimeDefaultFileData({ original: copiedOriginal, transforms })),
        variants: {
          ...copiedVariants,
          ...Object.fromEntries(
            requestTimeVariantNames.map((name) => [name, requestTimeVariants[name]]),
          ),
        },
      }

      return write(setFileEndpointURLs({ collection, req, restored }))
    },
  })
}

/** Points request-time entries, and every entry with local storage, at Payload's file endpoint. */
function setFileEndpointURLs({
  collection,
  req,
  restored,
}: { restored: JsonObject } & Pick<FileRestoreArgs<unknown>, 'collection' | 'req'>): JsonObject {
  const entries = [
    { entry: restored, isOriginal: false },
    {
      entry: restored.original as JsonObject,
      isOriginal: shouldRequestOriginal({ doc: restored }),
    },
    ...Object.values(restored.variants ?? {}).map((entry) => ({
      entry: entry as JsonObject,
      isOriginal: false,
    })),
  ]

  for (const { entry, isOriginal } of entries) {
    if (entry?.filename && (!collection.upload.fileOperations || isRequestTimeFile({ entry }))) {
      entry.url = generateFilePathOrURL({
        collectionSlug: collection.slug,
        config: req.payload.config,
        filename: entry.filename,
        isOriginal,
        relative: true,
        urlOrPath: undefined,
      })
    }
  }

  return restored
}
