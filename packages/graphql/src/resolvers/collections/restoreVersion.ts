import type { Collection, Document, DocumentVersion, PayloadRequest } from 'payload'

import { isolateObjectProperty, restoreVersionOperation } from 'payload'

import type { Context } from '../types.js'

import { rememberDocumentVersion } from '../../utilities/documentVersion.js'

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
    version?: DocumentVersion
  },
  context: {
    req: PayloadRequest
  },
) => Promise<Document>

export function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context) {
    context.req.query = {
      ...context.req.query,
      version: args.version ?? (collection.config.versions?.drafts ? 'draft' : 'published'),
    }

    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
      version: args.version,
    }

    const result = await restoreVersionOperation(options)
    return rememberDocumentVersion({
      data: result,
      version: args.version ?? (collection.config.versions?.drafts ? 'draft' : 'published'),
    })
  }

  return resolver
}
