import type { ValidationFieldError } from '../../../errors/ValidationError.js'
import type { JsonObject, PayloadRequest, SelectIncludeType } from '../../../types/index.js'
import type { SanitizedCollectionConfig } from '../../config/types.js'

import { ValidationError } from '../../../errors/index.js'
import { fieldAffectsData } from '../../../fields/config/types.js'
import { documentMatchingWhereExists } from '../../../utilities/documentMatchingWhereExists.js'
import { fieldValueExists } from '../../../utilities/fieldValueExists.js'
import { getObjectDotNotation } from '../../../utilities/getObjectDotNotation.js'
import { isolateObjectProperty } from '../../../utilities/isolateObjectProperty.js'
import { traverseFields } from '../../../utilities/traverseFields.js'
import { unflatten } from '../../../utilities/unflatten.js'

type Args = {
  collection: SanitizedCollectionConfig
  data: JsonObject
  id?: number | string
  req: PayloadRequest
}

type UniqueFieldValue = {
  field: string
  value: unknown
} & Pick<ValidationFieldError, 'label' | 'path'>

export const validateUniqueConstraints = async ({
  id,
  collection,
  data,
  req,
}: Args): Promise<void> => {
  const uniqueFieldValues: UniqueFieldValue[] = []

  traverseFields({
    callback: ({ field, parentPath, ref }) => {
      if (!fieldAffectsData(field) || !field.unique || !ref || typeof ref !== 'object') {
        return
      }

      const value = ref[field.name as keyof typeof ref]

      if (value === null || typeof value === 'undefined') {
        return
      }

      uniqueFieldValues.push({
        field: `${parentPath}${field.name}`,
        label: field.label || undefined,
        path: `${parentPath}${field.name}`,
        value,
      })
    },
    config: req.payload.config,
    fields: collection.fields,
    fillEmpty: false,
    ref: data,
  })

  const conflicts = await Promise.all(
    uniqueFieldValues.map(async (uniqueFieldValue) => ({
      ...uniqueFieldValue,
      exists: await fieldValueExists({
        id,
        collection: collection.slug,
        field: uniqueFieldValue.field,
        locale: req.locale ?? undefined,
        overrideAccess: true,
        req,
        value: uniqueFieldValue.value,
      }),
    })),
  )
  const errors: ValidationFieldError[] = conflicts
    .filter(({ exists }) => exists)
    .map(({ label, path }) => ({
      label,
      message: req.t('error:valueMustBeUnique'),
      path,
    }))

  const uniqueCompoundIndexes = collection.sanitizedIndexes.filter(({ unique }) => unique)
  const compoundIndexConflicts = await Promise.all(
    uniqueCompoundIndexes.map(async (index) => {
      const requiredFields = req.payload.db.name === 'mongoose' ? (index.requireExists ?? []) : []

      if (requiredFields.some(({ path }) => getObjectDotNotation(data, path) === undefined)) {
        return null
      }

      const values = index.fields.map(({ path }) => ({
        path,
        value: getObjectDotNotation(data, path),
      }))

      if (
        !requiredFields.length &&
        values.some(({ value }) => value === null || typeof value === 'undefined')
      ) {
        return null
      }

      const where = {
        and: values.map(({ path, value }) => ({ [path]: { equals: value ?? null } })),
      }
      let exists: boolean

      const shouldReadRawCandidates =
        requiredFields.length > 0 &&
        (values.some(({ value }) => value == null) ||
          requiredFields.some(({ path }) => !index.fields.some((field) => field.path === path)))

      if (shouldReadRawCandidates) {
        // Payload's `exists` operator excludes null, while MongoDB partial indexes include it.
        // Raw candidates preserve the distinction between a stored null and an absent field.
        const queryReq = isolateObjectProperty(req, ['transactionID'])

        delete queryReq.transactionID

        const requiredPaths = requiredFields.map((field) =>
          field.pathHasLocalized && req.payload.config.localization && req.locale
            ? field.localizedPath.replaceAll('<locale>', req.locale)
            : field.path,
        )
        const select: SelectIncludeType = unflatten(
          Object.fromEntries([['id', true], ...requiredFields.map(({ path }) => [path, true])]),
          { object: true },
        )

        const { docs } = await req.payload.db.find({
          collection: collection.slug,
          limit: 0,
          locale: req.locale ?? undefined,
          pagination: false,
          req: queryReq,
          select,
          where,
        })

        exists = docs.some(
          (doc) =>
            doc.id !== id &&
            requiredPaths.every((path) => getObjectDotNotation(doc, path) !== undefined),
        )
      } else {
        exists = await documentMatchingWhereExists({
          id,
          collection: collection.slug,
          locale: req.locale ?? undefined,
          overrideAccess: true,
          req,
          where,
        })
      }

      return exists ? index : null
    }),
  )

  for (const index of compoundIndexConflicts) {
    if (!index) {
      continue
    }

    for (const { field, path } of index.fields) {
      errors.push({
        label: field.label || undefined,
        message: req.t('error:valueMustBeUnique'),
        path,
      })
    }
  }

  const deduplicatedErrors = [...new Map(errors.map((error) => [error.path, error])).values()]

  if (deduplicatedErrors.length > 0) {
    throw new ValidationError(
      {
        id,
        collection: collection.slug,
        errors: deduplicatedErrors,
        req,
      },
      req.t,
    )
  }
}
