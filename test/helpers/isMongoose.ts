import type { Payload } from '../../packages/payload/src/index.js'

export function isMongoose(_payload?: Payload) {
  return _payload?.db?.name === 'mongoose' || ['mongoose'].includes(process.env.PAYLOAD_DATABASE)
}
