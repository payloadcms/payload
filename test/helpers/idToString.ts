import type { Payload } from '../../packages/payload/src'

export const idToString = (id: number | string, payload: Payload): string =>
  `${payload.db.defaultIDType === 'number' ? id : `"${id}"`}`
