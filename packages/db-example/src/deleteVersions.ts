/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteVersions } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: ExampleAdapter,
  {
    collection, // The specified collection to delete versions from
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query for querying the documents in question to delete
  },
) {
  /**
   * Implement the logic to delete many version documents from your database.
   *
   * @example
   * ```ts
   * await adapterSpecificVersionsModel.deleteMany(query, options)
   * ```
   */
}
