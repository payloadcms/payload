import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { NotFound } from '../../errors/NotFound.js'
import { TransformerContractError } from '../../errors/TransformerContractError.js'
import { checkFileAccess } from '../checkFileAccess.js'
import { retrieveFileResponse } from '../endpoints/getFile.js'
import { createLazySourceGetter } from './createLazySourceGetter.js'
import { finalizeFileResponse } from './finalizeFileResponse.js'
import { getSourceFileResponse } from './getSourceFileResponse.js'
import { planTransformerPipeline } from './planTransformerPipeline.js'
import { resolveUploadDocument } from './resolveUploadDocument.js'
import { withFileTransformAccessContext } from './withFileTransformAccessContext.js'

/**
 * Orchestrates a dynamic file request end to end: resolve the document, plan the
 * request-capable transformer pipeline from its authoritative MIME type, enforce
 * transform-aware read access, then run every eligible transformer in declaration
 * order against a lazily-fetched source. Called from `getFileHandler` only when at
 * least one transformer is configured (Decision 5) — the zero-transformer path
 * never reaches this function.
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
  const document = await resolveUploadDocument({ collection, filename, prefix, req })

  if (!document) {
    throw new NotFound(req.t)
  }

  const pipeline = await planTransformerPipeline({
    args: {
      collectionSlug: collection.config.slug,
      documentID: document.id,
      mimeType: document.mimeType,
      operation: 'request',
      req,
    },
    capability: 'handleRequest',
    transformers: req.payload.config.upload.transformers,
  })

  await withFileTransformAccessContext({
    isTransform: pipeline.length > 0,
    req,
    run: () => checkFileAccess({ collection, filename, prefix, req }),
  })

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
        filename: document.filename,
        getSourceFile: stageSource.get,
        mimeType: document.mimeType,
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

  // No transformer ultimately produced a response — serve the original file
  // exactly as the non-transformer path would (full Range/ETag/redirect support,
  // `modifyResponseHeaders` applied in its existing order), per the error contract's
  // "No transformer joins the pipeline: serve the original file normally."
  return retrieveFileResponse({ collection, doc: document, filename, prefix, req })
}
