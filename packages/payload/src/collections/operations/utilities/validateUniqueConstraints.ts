import type { ValidationFieldError } from '../../../errors/ValidationError.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { SanitizedCollectionConfig } from '../../config/types.js'

import { ValidationError } from '../../../errors/index.js'
import { fieldAffectsData } from '../../../fields/config/types.js'
import { documentMatchingWhereExists } from '../../../utilities/documentMatchingWhereExists.js'
import { fieldValueExists } from '../../../utilities/fieldValueExists.js'
import { getObjectDotNotation } from '../../../utilities/getObjectDotNotation.js'
import { traverseFields } from '../../../utilities/traverseFields.js'

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
      const values = index.fields.map(({ path }) => ({
        path,
        value: getObjectDotNotation(data, path),
      }))

      if (values.some(({ value }) => value === null || typeof value === 'undefined')) {
        return null
      }

      const exists = await documentMatchingWhereExists({
        id,
        collection: collection.slug,
        locale: req.locale ?? undefined,
        overrideAccess: true,
        req,
        where: {
          and: values.map(({ path, value }) => ({
            [path]: {
              equals: value,
            },
          })),
        },
      })

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
