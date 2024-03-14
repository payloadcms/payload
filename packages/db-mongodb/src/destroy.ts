import type { Destroy } from 'payload/database'

import mongoose from 'mongoose'

import type { MongooseAdapter } from './index.js'

export const destroy: Destroy = async function destroy(this: MongooseAdapter) {
  if (this.mongoMemoryServer) {
    this.mongoMemoryServer.stop()
  }

  await mongoose.disconnect()
  Object.keys(mongoose.models).map((model) => mongoose.deleteModel(model))
}
