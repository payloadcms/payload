import type { UpdateGlobalVersionArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import type { ExampleAdapter } from '.'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: ExampleAdapter,
  {
    id,
    global,
    locale,
    req = {} as PayloadRequest,
    versionData,
    where,
  }: UpdateGlobalVersionArgs<T>,
) {
  /**
   * Implement the logic to get the adapterSpecificModel for global versions from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.versions[global]
   * ```
   */
  let adapterSpecificModel

  const whereToUse = where || { id: { equals: id } }

  // Replace this with your session handling or remove if not needed
  const options = {}

  /**
   * Implement the query building logic according to your database syntax.
   *
   * @example
   * ```ts
   * const query = {} // Build your query here
   * ```
   */
  const query = {}

  /**
   * Implement the logic to find one and update the document in your database.
   *
   * @example
   * ```ts
   * const doc = await adapterSpecificModel.findOneAndUpdate(query, versionData, options)
   * ```
   */
  const doc = await adapterSpecificModel.findOneAndUpdate(query, versionData, options)

  /**
   * Convert the result to the expected document format
   *
   * The result of the outgoing data is always going to be the same shape that Payload expects
   *
   * @example
   * ```ts
   * const result = JSON.parse(JSON.stringify(doc))
   * ```
   */
  const result = doc

  return result
}
