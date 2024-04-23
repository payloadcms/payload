import type { Destroy } from 'payload/database'

import type { PostgresAdapter } from './types.js'

// eslint-disable-next-line @typescript-eslint/require-await
export const destroy: Destroy = async function destroy(this: PostgresAdapter) {
  this.enums = {}
  this.schema = {}
  this.tables = {}
  this.relations = {}
  this.blockTableNames = {}
  this.fieldConstraints = {}
  this.drizzle = undefined
}
