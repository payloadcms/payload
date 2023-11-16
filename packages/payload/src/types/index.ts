import type { TypeWithTimestamps } from '../collections/config/types'
import type { validOperators } from './constants'

export type { PayloadRequest } from '../express/types'

export type Operator = (typeof validOperators)[number]

export type WhereField = {
  [key in Operator]?: unknown
}

export type Where = {
  [key: string]: Where[] | WhereField
  and?: Where[]
  or?: Where[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Document = any

export type Operation = 'create' | 'delete' | 'read' | 'update'
export type VersionOperations = 'readVersions'
export type AuthOperations = 'unlock'
export type AllOperations = AuthOperations | Operation | VersionOperations

export function docHasTimestamps(doc: any): doc is TypeWithTimestamps {
  return doc?.createdAt && doc?.updatedAt
}
