import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'
import type { ResolvedUploadDocument } from './resolveUploadDocument.js'

import { retrieveFileResponse } from '../endpoints/getFile.js'

/**
 * Payload's internal source-retrieval used by a request transformer's lazy
 * `getSourceFile` getter. A thin wrapper over the same handler-loop/local-fs
 * logic the ordinary `read` endpoint uses, called with `operation: 'transform'`.
 */
export async function getSourceFileResponse({
  collection,
  document,
  filename,
  prefix,
  req,
}: {
  collection: Collection
  document: ResolvedUploadDocument
  filename: string
  prefix?: string
  req: PayloadRequest
}): Promise<Response> {
  return retrieveFileResponse({
    collection,
    doc: document,
    filename,
    operation: 'transform',
    prefix,
    req,
  })
}
