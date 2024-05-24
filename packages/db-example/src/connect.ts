import type { Connect } from 'payload/database'

import type { ExampleAdapter } from '.'

/**
 * Implement the connect feature here. This will connect to the underlying resource and set the this.connection property.
 *
 * Optional - this method is not required
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {Payload} payload
 * @returns {Promise<void>} A promise that resolves when the connection is established.
 *
 * @example
 * ```ts
 * this.connection = await myUnderlyingStore.connect(this.url)
 * ```
 */
export const connect: Connect = async function connect(this: ExampleAdapter, payload) {
  try {
    // this.connection = await myUnderlyingStore.connect(this.url)
  } catch (err) {
    this.payload.logger.error(`Error: cannot connect to DB. Details: ${err.message}`, err)
    process.exit(1)
  }
}
