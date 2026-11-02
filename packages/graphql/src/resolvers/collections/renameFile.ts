import type { Collection } from 'payload'

import { isolateObjectProperty, renameFileOperation } from 'payload'

import type { Context } from '../types.js'

export const renameFileResolver =
  (collection: Collection) =>
  async (
    _: unknown,
    args: { draft?: boolean; filename: string; id: number | string },
    context: Context,
  ) =>
    renameFileOperation({
      id: args.id,
      collection,
      draft: args.draft,
      filename: args.filename,
      req: isolateObjectProperty(context.req, 'transactionID'),
    })
