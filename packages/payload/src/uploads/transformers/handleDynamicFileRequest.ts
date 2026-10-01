import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { ResolvedUploadDocument } from './resolveUploadDocument.js'
import type { UploadTransformer } from './types.js'

import { Forbidden } from '../../errors/Forbidden.js'
import { NotFound } from '../../errors/NotFound.js'
import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { retrieveFileResponse } from '../endpoints/getFile.js'
import { resolveHistoricalFile } from '../fileVersioning/resolveHistoricalFile.js'
import { createLazySourceGetter } from './createLazySourceGetter.js'
import { finalizeFileResponse } from './finalizeFileResponse.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { getCandidateTransformers, planTransformerPipeline } from './planTransformerPipeline.js'
import { getRequestedFile, resolveUploadDocument } from './resolveUploadDocument.js'
import { withFileTransformAccessContext } from './withFileTransformAccessContext.js'

/**
 * Orchestrates a dynamic file request end to end: resolve the document, plan the
 * request-capable transformer pipeline from the requested file's authoritative
 * MIME type (the primary file or the matched image size), enforce
 * transform-aware read access, then run every eligible transformer in declaration
 * order against a lazily-fetched source. Called from `getFileHandler` only when at
 * least one transformer is configured — the zero-transformer path never reaches
 * this function.
 */
export async function handleDynamicFileRequest({
  collection,
  filename,
  prefix,
  req,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
}): Promise<Response> {
  const resolvedDocument = await resolveUploadDocument({ collection, filename, prefix, req })

  if (!resolvedDocument) {
    if (collection.config.versions) {
      const historical = await resolveHistoricalFile({ collection, filename, prefix, req })
      return retrieveFileResponse({ collection, doc: historical, filename, prefix, req })
    }

    // There's no mimeType to plan a pipeline from, so both access modes must pass
    // before admitting the file doesn't exist — otherwise the status code would leak
    // file existence to an access function keyed on req.fileTransform.
    for (const isTransform of [true, false]) {
      await withFileTransformAccessContext({
        callback: () => checkFileAccess({ collection, filename, prefix, req }),
        isTransform,
        req,
      })
    }
    throw new NotFound(req.t)
  }

  if (
    resolvedDocument.original?.filename === filename &&
    (resolvedDocument.filename !== filename || req.searchParams.size === 0)
  ) {
    const permittedDocument = await withFileTransformAccessContext({
      callback: () => checkFileAccess({ collection, filename, prefix, req }),
      isTransform: false,
      req,
    })

    return retrieveFileResponse({
      collection,
      doc: (permittedDocument ?? resolvedDocument) as ResolvedUploadDocument,
      filename,
      prefix,
      req,
    })
  }

  const { document, pipeline } = await authorizeDocument({
    collection,
    filename,
    prefix,
    req,
    resolvedDocument,
  })

  const requestedFile = getRequestedFile({ document, filename })

  const source = createLazySourceGetter({
    retrieve: () => getSourceFileResponse({ collection, document, filename, prefix, req }),
  })

  let currentResponse: Response | undefined

  try {
    for (const transformer of pipeline) {
      const stageSource = createLazySourceGetter({
        retrieve: async () => currentResponse ?? source.get(),
      })

      const result = await transformer.handleRequest!({
        collectionSlug: collection.config.slug,
        documentID: document.id,
        filename: requestedFile.filename,
        getSourceFile: stageSource.get,
        mimeType: requestedFile.mimeType,
        req,
      })

      if (result.response) {
        currentResponse = result.response
      } else if (stageSource.wasCalled()) {
        throw new TransformerContractError(
          'A transformer that consumes its source must return a response.',
        )
      }

      if (result.status === 'complete') {
        return finalizeFileResponse({ collection, req, response: currentResponse! })
      }
    }
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Error running the file transformer pipeline' })
    throw err
  }

  if (currentResponse) {
    return finalizeFileResponse({ collection, req, response: currentResponse })
  }

  // No transformer produced a response — serve the original file through the
  // normal path (Range/ETag/redirect support, existing `modifyResponseHeaders` order).
  return retrieveFileResponse({ collection, doc: document, filename, prefix, req })
}

function planRequestPipeline({
  collection,
  document,
  filename,
  req,
}: {
  collection: Collection
  document: ResolvedUploadDocument
  filename: string
  req: PayloadRequest
}): Promise<UploadTransformer[]> {
  return planTransformerPipeline({
    args: {
      collectionSlug: collection.config.slug,
      documentID: document.id,
      mimeType: getRequestedFile({ document, filename }).mimeType,
      operation: 'request',
      req,
    },
    capability: 'handleRequest',
    transformers: req.payload.config.upload.transformers,
  })
}

type AccessResult = { document?: ResolvedUploadDocument; isAllowed: true } | { isAllowed: false }

/**
 * Decides which document is served and which pipeline runs, checking read access
 * before any application-defined transformer code (`canTransform`) executes.
 *
 * 1. The first access mode comes from MIME matching alone: a transform-aware check
 *    when any transformer could handle the file, otherwise an ordinary read.
 * 2. If the transform-aware check is denied, an ordinary read may still be allowed
 *    (e.g. public originals, signed-in-only variants), so that mode is tried next.
 * 3. Only once a check has passed does `canTransform` plan the real pipeline.
 * 4. The access mode the final pipeline requires must itself have passed — a
 *    "variants only" policy must not leak the original when no transformer applies.
 *
 * `resolveUploadDocument` is unfiltered, so without a `prefix` it can match a
 * document the user can't read that shares the filename (filenames are only
 * unique per prefix). Whenever `checkFileAccess` returns a document, that
 * authorized document is the one served — storage adapters trust `doc` to
 * resolve the object key.
 */
async function authorizeDocument({
  collection,
  filename,
  prefix,
  req,
  resolvedDocument,
}: {
  collection: Collection
  filename: string
  prefix?: string
  req: PayloadRequest
  resolvedDocument: ResolvedUploadDocument
}): Promise<{ document: ResolvedUploadDocument; pipeline: UploadTransformer[] }> {
  const accessResults = new Map<boolean, Promise<AccessResult>>()

  const checkAccess = ({ isTransform }: { isTransform: boolean }): Promise<AccessResult> => {
    if (!accessResults.has(isTransform)) {
      accessResults.set(
        isTransform,
        withFileTransformAccessContext({
          callback: () => checkFileAccess({ collection, filename, prefix, req }),
          isTransform,
          req,
        }).then(
          (document) => ({
            document: document as ResolvedUploadDocument | undefined,
            isAllowed: true as const,
          }),
          (err: unknown) => {
            if (err instanceof Forbidden) {
              return { isAllowed: false as const }
            }

            throw err
          },
        ),
      )
    }

    return accessResults.get(isTransform)!
  }

  const hasCandidateTransformers =
    getCandidateTransformers({
      capability: 'handleRequest',
      mimeType: getRequestedFile({ document: resolvedDocument, filename }).mimeType,
      transformers: req.payload.config.upload.transformers,
    }).length > 0

  let isTransformAccess = hasCandidateTransformers
  let access = await checkAccess({ isTransform: isTransformAccess })

  if (!access.isAllowed && isTransformAccess) {
    isTransformAccess = false
    access = await checkAccess({ isTransform: isTransformAccess })
  }

  if (!access.isAllowed) {
    throw new Forbidden(req.t)
  }

  const document =
    access.document && access.document.id !== resolvedDocument.id
      ? access.document
      : resolvedDocument

  const pipeline = await planRequestPipeline({ collection, document, filename, req })
  const isTransform = pipeline.length > 0

  if (isTransform !== isTransformAccess) {
    const requiredAccess = await checkAccess({ isTransform })

    if (
      !requiredAccess.isAllowed ||
      (requiredAccess.document && requiredAccess.document.id !== document.id)
    ) {
      throw new Forbidden(req.t)
    }
  }

  return { document, pipeline }
}
