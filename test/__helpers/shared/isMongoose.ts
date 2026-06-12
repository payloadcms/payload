import type { Payload } from 'payload'

export const mongooseList = ['cosmosdb', 'documentdb', 'firestore', 'mongodb', 'mongodb-atlas']

export function isMongoose(_payload?: Payload) {
  return _payload?.db?.name === 'mongoose' || mongooseList.includes(process.env.PAYLOAD_DATABASE)
}
