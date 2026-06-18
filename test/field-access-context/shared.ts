import type { FieldAccess } from 'payload'

export const parentsSlug = 'field-access-context-parents'
export const childrenSlug = 'field-access-context-children'
export const globalSlug = 'field-access-context-global'

export type AccessLogEntry = {
  collectionSlug: string | undefined
  fieldName: string
  operation: 'create' | 'read' | 'update'
  source: 'field-access' | 'find-distinct' | 'permissions'
}

const accessLog: AccessLogEntry[] = []

export const pushAccessLog = (entry: AccessLogEntry): void => {
  accessLog.push(entry)
}

export const readAccessLog = (): AccessLogEntry[] => [...accessLog]

export const resetAccessLog = (): void => {
  accessLog.length = 0
}

export const recordAccess = ({
  fieldName,
  operation,
  source,
}: Pick<AccessLogEntry, 'fieldName' | 'operation' | 'source'>): FieldAccess => {
  return ({ collectionSlug }) => {
    pushAccessLog({ collectionSlug, fieldName, operation, source })

    return true
  }
}
