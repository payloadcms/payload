import type { Document, DocumentVersion, PayloadRequest, SanitizedGlobalConfig } from 'payload'

import { isolateObjectProperty, restoreVersionOperationGlobal } from 'payload'

import type { Context } from '../types.js'

import { rememberDocumentVersion } from '../../utilities/documentVersion.js'

type Resolver = (
  _: unknown,
  args: {
    id: number | string
    version?: DocumentVersion
  },
  context: {
    req: PayloadRequest
  },
) => Promise<Document>
export function restoreVersion(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context: Context) {
    context.req.query = {
      ...context.req.query,
      version: args.version ?? (globalConfig.versions?.drafts ? 'draft' : 'published'),
    }

    const options = {
      id: args.id,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
      version: args.version,
    }

    const result = await restoreVersionOperationGlobal(options)
    return rememberDocumentVersion({
      data: result,
      version: args.version ?? (globalConfig.versions?.drafts ? 'draft' : 'published'),
    })
  }
}
