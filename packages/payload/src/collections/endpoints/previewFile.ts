import type { PayloadHandler } from '../../config/types.js'
import type { ResolvedUploadDocument } from '../../uploads/transformers/resolveUploadDocument.js'

import { executeAccess } from '../../auth/executeAccess.js'
import { combineQueries } from '../../database/combineQueries.js'
import { APIError, NotFound } from '../../errors/index.js'
import { checkFileAccess } from '../../uploads/checkFileAccess.js'
import { createFileSource } from '../../uploads/transformers/createFileSource.js'
import { createUploadFileSource } from '../../uploads/transformers/createUploadFileSource.js'
import { getSourceFileResponse } from '../../uploads/transformers/getSourceFileResponse.js'
import { handleDynamicFileRequest } from '../../uploads/transformers/handleDynamicFileRequest.js'
import { withFileTransformAccessContext } from '../../uploads/transformers/withFileTransformAccessContext.js'
import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import { getRequestCollectionWithID } from '../../utilities/getRequestEntity.js'

/** Render unsaved edits without running document write hooks or writing files. */
export const previewFileHandler: PayloadHandler = async (req) => {
  const cleanup = async () => {
    await unlinkTempFiles({ config: req.payload.config, req }).catch((err) => {
      req.payload.logger.error({ err, msg: 'Failed to remove preview upload temporary files' })
    })
  }
  try {
    const response = await renderPreviewFile(req)
    if (!req.file?.tempFilePath || !response.body) {
      await cleanup()
      return response
    }
    const reader = response.body.getReader()
    const body = new ReadableStream<Uint8Array>({
      async cancel(reason) {
        try {
          await reader.cancel(reason)
        } finally {
          await cleanup()
        }
      },
      async pull(controller) {
        try {
          const result = await reader.read()
          if (result.done) {
            await cleanup()
            controller.close()
          } else {
            controller.enqueue(result.value)
          }
        } catch (err) {
          await cleanup()
          controller.error(err)
        }
      },
    })
    return new Response(body, { headers: response.headers, status: response.status })
  } catch (err) {
    await cleanup()
    throw err
  }
}

const renderPreviewFile: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req, { optionalID: true })
  const collectionSlug = collection.config.slug

  if (!collection.config.upload) {
    throw new APIError('This collection does not support file previews.', 400)
  }
  if (!Object.prototype.hasOwnProperty.call(req.data ?? {}, '_transforms')) {
    throw new APIError('File previews require _transforms (use null to clear edits).', 400)
  }

  if (
    req.data?.variant !== undefined &&
    (typeof req.data.variant !== 'string' ||
      !collection.config.upload.variants?.some(({ name }) => name === req.data!.variant))
  ) {
    throw new APIError('Unknown image preview variant.', 400)
  }
  const access = await executeAccess(
    { id, slug: collectionSlug, data: req.data, req },
    id === undefined ? collection.config.access.create : collection.config.access.update,
  )
  const document =
    id === undefined
      ? undefined
      : await withFileTransformAccessContext({
          callback: async () => {
            const result = await req.payload.find({
              collection: collectionSlug,
              depth: 0,
              limit: 1,
              overrideAccess: false,
              pagination: false,
              req,
              user: req.user,
              where: combineQueries({ id: { equals: id } }, access),
            })
            if (!result.docs[0]) {
              throw new NotFound(req.t)
            }
            const doc = result.docs[0] as ResolvedUploadDocument
            await checkFileAccess({ collection, documentID: doc.id, filename: doc.filename, req })
            return doc
          },
          isTransform: true,
          req,
        })

  if (!req.file && !document?.filename) {
    throw new APIError('A file is required to preview edits.', 400)
  }
  // Provider references are verified by write operations; this endpoint accepts bytes only.
  if (req.file?.uploadReference) {
    throw new APIError('File previews require an uploaded file, not a provider reference.', 400)
  }

  const original = document?.original ?? document
  if (document && !req.file) {
    await withFileTransformAccessContext({
      callback: () =>
        checkFileAccess({
          collection,
          documentID: document.id,
          filename: original?.filename ?? document.filename,
          req,
        }),
      isTransform: false,
      req,
    })
  }
  const source = req.file
    ? createUploadFileSource({ collectionSlug, file: req.file, req })
    : createFileSource({
        filename: original?.filename ?? document!.filename,
        mimeType: original?.mimeType ?? document!.mimeType ?? 'application/octet-stream',
        retrieve: () =>
          getSourceFileResponse({
            collection,
            document: document!,
            filename: original?.filename ?? document!.filename,
            req,
          }),
      })
  const response = await handleDynamicFileRequest({
    collection,
    filename: req.file ? source.filename : document!.filename,
    preview: {
      document: req.file
        ? { id: '_preview', filename: source.filename, mimeType: source.mimeType }
        : document!,
      isNewFile: Boolean(req.file),
      source,
      transforms: req.data!._transforms,
    },
    req,
  })
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.delete('ETag')
  response.headers.delete('Last-Modified')
  return response
}
