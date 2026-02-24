import type { PayloadRequest } from 'payload'

import { ValidationError } from 'payload'

import type { DrizzleAdapter } from '../types.js'

type HandleUpsertErrorArgs = {
  adapter: DrizzleAdapter
  collectionSlug?: string
  error: unknown
  globalSlug?: string
  id?: number | string
  req?: Partial<PayloadRequest>
  tableName: string
}

/**
 * Handles unique constraint violation errors from PostgreSQL and SQLite,
 * converting them to Payload ValidationErrors.
 * Re-throws non-constraint errors unchanged.
 */
export const handleUpsertError = ({
  id,
  adapter,
  collectionSlug,
  error: caughtError,
  globalSlug,
  req,
  tableName,
}: HandleUpsertErrorArgs): never => {
  let error: any = caughtError
  if (typeof caughtError === 'object' && caughtError !== null && 'cause' in caughtError) {
    error = caughtError.cause
  }

  // PostgreSQL: 23505, SQLite: SQLITE_CONSTRAINT_UNIQUE
  if (error?.code === '23505' || error?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    let fieldName: null | string = null

    if (error.code === '23505') {
      // PostgreSQL - extract field name from constraint
      if (adapter.fieldConstraints?.[tableName]?.[error.constraint]) {
        fieldName = adapter.fieldConstraints[tableName][error.constraint]
      } else {
        const replacement = `${tableName}_`
        if (error.constraint?.includes(replacement)) {
          const replacedConstraint = error.constraint.replace(replacement, '')
          if (replacedConstraint && adapter.fieldConstraints[tableName]?.[replacedConstraint]) {
            fieldName = adapter.fieldConstraints[tableName][replacedConstraint]
          }
        }
      }

      if (!fieldName && error.detail) {
        // Extract from detail: "Key (field)=(value) already exists."
        const regex = /Key \(([^)]+)\)=\(([^)]+)\)/
        const match: string[] = error.detail.match(regex)
        if (match && match[1]) {
          fieldName = match[1]
        }
      }
    } else if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      // SQLite - extract from message: "UNIQUE constraint failed: table.field"
      const regex = /UNIQUE constraint failed: ([^.]+)\.([^.]+)/
      const match: string[] = error.message?.match(regex)
      if (match && match[2]) {
        if (adapter.fieldConstraints[tableName]) {
          fieldName = adapter.fieldConstraints[tableName][`${match[2]}_idx`]
        }
        if (!fieldName) {
          fieldName = match[2]
        }
      }
    }

    // Compose path with optional provided block path
    let path = fieldName
    if (
      typeof caughtError === 'object' &&
      '_blockPath' in caughtError &&
      typeof caughtError._blockPath === 'string'
    ) {
      path = `${caughtError._blockPath}${path}`
    }

    throw new ValidationError(
      {
        id,
        collection: collectionSlug,
        errors: [
          {
            message: req?.t ? req.t('error:valueMustBeUnique') : 'Value must be unique',
            path,
          },
        ],
        global: globalSlug,
        req,
      },
      req?.t,
    )
  }

  // Re-throw non-constraint errors
  throw caughtError
}
