import type { CreateVersion } from 'payload/database'
import type { PayloadRequest } from 'payload/types'
import type { Document } from 'payload/types'

import type { ExampleAdapter } from '.'

export const createVersion: CreateVersion = async function createVersion(
  this: ExampleAdapter,
  {
    autosave,
    collectionSlug,
    createdAt,
    parent,
    req = {} as PayloadRequest,
    updatedAt,
    versionData,
  },
) {
  /**
   * Implement the logic to get the adapterSpecificVersionModel for collections from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificVersionModel = this.versions[collectionSlug];
   * ```
   */
  let adapterSpecificVersionModel

  // Replace this with your session handling or remove if not needed
  const options = {}

  /**
   * Implement the logic to create the version document in your database.
   *
   * @example
   * ```ts
   * doc = await adapterSpecificVersionModel.create({
   *   autosave,
   *   createdAt,
   *   latest: true,
   *   parent,
   *   updatedAt,
   *   version: versionData,
   * }, options, req);
   * ```
   */
  const [doc] = await adapterSpecificVersionModel.create(
    [
      {
        autosave,
        createdAt,
        latest: true,
        parent,
        updatedAt,
        version: versionData,
      },
    ],
    options,
    req,
  )

  /**
   * Implement the logic to update existing version documents to unset the latest flag.
   *
   * @example
   * ```ts
   * await adapterSpecificVersionModel.updateMany(
   *   {
   *     // Your query conditions here
   *   },
   *   { $unset: { latest: 1 } },
   *   options,
   * );
   * ```
   */
  await adapterSpecificVersionModel.updateMany(
    {
      // Your query conditions here
    },
    { $unset: { latest: 1 } },
    options,
  )

  /**
   * Convert the result to the expected document format
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   * @example
   * ```ts
   * const result: Document = JSON.parse(JSON.stringify(doc))
   * ```
   */
  const result: Document = doc
  return result
}
