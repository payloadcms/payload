import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { ResolvedUploadDocument } from './resolveUploadDocument.js'
import type { UploadTransformer } from './types.js'

import { Forbidden } from '../../errors/Forbidden.js'
import { NotFound } from '../../errors/NotFound.js'
import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { retrieveFileResponse } from '../endpoints/getFile.js'
import { createLazySourceGetter } from './createLazySourceGetter.js'
import { finalizeFileResponse } from './finalizeFileResponse.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { planTransformerPipeline } from './planTransformerPipeline.js'
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
    // Force isTransform: true — there's no mimeType to plan a pipeline from, so this
    // must assume the stricter transform-aware access check, or the status code would
    // leak file existence to an access function keyed on req.fileTransform.
    await withFileTransformAccessContext({
      callback: () => checkFileAccess({ collection, filename, prefix, req }),
      isTransform: true,
      req,
    })
    throw new NotFound(req.t)
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

/**
 * `resolveUploadDocument` is unfiltered, so without a `prefix` it can match a
 * document the user can't read that shares the filename (filenames are only
 * unique per prefix). Whenever `checkFileAccess` returns a document, that
 * authorized document is the one served — storage adapters trust `doc` to
 * resolve the object key. If it differs, the pipeline is re-planned from its
 * `mimeType`, and access is re-checked when that turns a plain read into a transform.
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
  const checkAccess = ({ isTransform }: { isTransform: boolean }) =>
    withFileTransformAccessContext({
      callback: () => checkFileAccess({ collection, filename, prefix, req }),
      isTransform,
      req,
    }) as Promise<ResolvedUploadDocument | undefined>

  const pipeline = await planRequestPipeline({
    collection,
    document: resolvedDocument,
    filename,
    req,
  })

  const accessDocument = await checkAccess({ isTransform: pipeline.length > 0 })

  if (!accessDocument || accessDocument.id === resolvedDocument.id) {
    return { document: resolvedDocument, pipeline }
  }

  const accessPipeline = await planRequestPipeline({
    collection,
    document: accessDocument,
    filename,
    req,
  })

  if (accessPipeline.length > 0 && pipeline.length === 0) {
    const transformAccessDocument = await checkAccess({ isTransform: true })

    if (transformAccessDocument && transformAccessDocument.id !== accessDocument.id) {
      throw new Forbidden(req.t)
    }
  }

  return { document: accessDocument, pipeline: accessPipeline }
}
