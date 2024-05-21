import type { Destroy } from 'payload/database'

import mongoose from 'mongoose'

import type { ExampleAdapter } from './index'

export const destroy: Destroy = async function destroy(this: ExampleAdapter) {
  if (this.mongoMemoryServer) {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await this.mongoMemoryServer.stop()
  } else {
    await mongoose.connection.close()
  }
}
