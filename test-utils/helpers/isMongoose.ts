import type { Payload } from 'payload'

export function isMongoose(_payload?: Payload) {
  return _payload?.db?.name === 'mongoose' || ['mongodb'].includes(process.env.PAYLOAD_DATABASE)
}
