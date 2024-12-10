import type { Destroy } from 'payload'

import mongoose from 'mongoose'

import type { MongooseAdapter } from './index.js'

export const destroy: Destroy = async function destroy(this: MongooseAdapter) {
  if (this.mongoMemoryServer) {
    await this.mongoMemoryServer.stop()
  } else {
    await mongoose.disconnect()
  }

  Object.keys(mongoose.models).map((model) => mongoose.deleteModel(model))
}
