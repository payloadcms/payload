import type { DeleteVersions } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: ExampleAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
) {
  /**
   * Implement the logic to get the adapterSpecificVersionsModel from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificVersionsModel = this.versions[collection];
   * ```
   */
  let adapterSpecificVersionsModel

  // Replace this with your session handling or remove if not needed
  const options = {}

  /**
   * Implement the query building logic according to your database syntax.
   *
   * @example
   * ```ts
   * const query = {}; // Build your query here
   * ```
   */
  const query = {}

  /**
   * Implement the logic to delete many version documents from your database.
   *
   * @example
   * ```ts
   * await adapterSpecificVersionsModel.deleteMany(query, options);
   * ```
   */
  await adapterSpecificVersionsModel.deleteMany(query, options)
}
