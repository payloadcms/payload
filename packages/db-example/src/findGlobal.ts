import type { FindGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { combineQueries } from 'payload/database'

import type { ExampleAdapter } from '.'

export const findGlobal: FindGlobal = async function findGlobal(
  this: ExampleAdapter,
  { slug, locale, req = {} as PayloadRequest, where },
) {
  /**
   * Implement the logic to get the adapterSpecificModel for globals from your database.
   *
   * @example
   * ```ts
   * const adapterSpecificModel = this.globals
   * ```
   */
  let adapterSpecificModel

  // Replace this with your session handling or remove if not needed
  const options = {}

  /**
   * Implement the query building logic according to your database syntax.
   *
   * @example
   * ```ts
   * const query = combineQueries({ globalType: { equals: slug } }, where)
   * ```
   */
  const query = combineQueries({ globalType: { equals: slug } }, where)

  /**
   * Implement the logic to find one document in your database.
   *
   * @example
   * ```ts
   * let doc = await adapterSpecificModel.findOne(query, {}, options)
   * ```
   */
  let doc = await adapterSpecificModel.findOne(query, {}, options)

  if (!doc) {
    return null
  }

  /**
   * If your database uses a different field for the document ID,
   * adjust the following lines accordingly.
   *
   * @example
   * ```ts
   * if (doc.idField) {
   *   doc.id = doc.idField
   *   delete doc.idField
   * }
   * ```
   */
  if (doc.idField) {
    // Adjust `idField` to your database's ID field
    doc.id = doc.idField
    delete doc.idField
  }

  /**
   * Convert the result to the expected document format
   *
   * @example
   * ```ts
   * doc = JSON.parse(JSON.stringify(doc))
   * ```
   */
  doc = JSON.parse(JSON.stringify(doc))

  return doc
}
