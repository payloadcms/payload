import type { DeleteMany } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const deleteMany: DeleteMany = async function deleteMany(
  this: ExampleAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  /**
   * Implement the logic to get the adapterSpecificModel from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.collections[collection];
   * ```
   */
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
   * Implement the logic to delete many documents from your database.
   *
   * @example
   * ```ts
   * await adapterSpecificModel.deleteMany(query, options);
   * ```
   */
  await adapterSpecificModel.deleteMany(query, options)
}
