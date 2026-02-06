import type { Destroy } from 'payload'

import type { MongooseAdapter } from './index.js'

export const destroy: Destroy = async function destroy(this: MongooseAdapter) {
  await this.connection.close()

  for (const name of Object.keys(this.connection.models)) {
    this.connection.deleteModel(name)
  }
}
