import type { Destroy } from 'payload/database'

import type { ExampleAdapter } from './index'

/**
 * Closes the database connection and cleans up resources used by the adapter.
 *
 * This function is typically used to gracefully shutdown the database connections
 * when the application is closing or when the adapter is no longer needed.
 *
 * Optional - this method is not required
 *
 * @param {ExampleAdapter} - The ExampleAdapter instance.
 * @returns {Promise<void>}
 */
export const destroy: Destroy = async function destroy(this: ExampleAdapter) {
  /**
   * If using an in-memory database or a similar service, add the specific steps to drop the database and stop the server.
   *
   * @example
   * ```ts
   * if (this.inMemoryDatabase) {
   *   await this.connection.dropDatabase()
   *
   *   await this.connection.close()
   *
   *   await this.inMemoryDatabase.stop()
   * } else {
   *   await this.connection.close()
   * }
   * ```
   */
}
