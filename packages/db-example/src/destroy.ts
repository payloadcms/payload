import type { Destroy } from 'payload/database'

import type { ExampleAdapter } from './index'

export const destroy: Destroy = async function destroy(this: ExampleAdapter) {
  /**
   * Implement the logic to close the database connection and clean up resources.
   *
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
