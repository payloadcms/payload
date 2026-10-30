import type { ValidationFieldError } from '../../../errors/index.js'
import type { JsonObject, PayloadRequest, SelectIncludeType } from '../../../types/index.js'
import type { SanitizedCollectionConfig } from '../../config/types.js'

import { ValidationError } from '../../../errors/index.js'
import { fieldAffectsData } from '../../../fields/config/types.js'
import { documentMatchingWhereExists } from '../../../utilities/documentMatchingWhereExists.js'
import { fieldValueExists } from '../../../utilities/fieldValueExists.js'
import { flattenDataByLocale } from '../../../utilities/flattenDataByLocale.js'
import { getObjectDotNotation } from '../../../utilities/getObjectDotNotation.js'
import { isolateObjectProperty } from '../../../utilities/isolateObjectProperty.js'
import { traverseFields } from '../../../utilities/traverseFields.js'
import { unflatten } from '../../../utilities/unflatten.js'

type Args = {
  collection: SanitizedCollectionConfig
  data: JsonObject
  dataWithLocales: JsonObject
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
  dataWithLocales,
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
      // Core performs uniqueness validation, and the adapter contract has no index-membership check.
      // Match MongoDB's requireExists filters here; SQL adapters ignore this option. Payload's
      // `exists` query operator cannot express these filters because it excludes explicit nulls.
      const requiredFields = req.payload.db.name === 'mongoose' ? (index.requireExists ?? []) : []

      const localization = req.payload.config.localization
      const hasLocalizedPartialIndex = Boolean(
        requiredFields.length &&
        localization &&
        [...index.fields, ...requiredFields].some(({ pathHasLocalized }) => pathHasLocalized),
      )
      const locales =
        hasLocalizedPartialIndex && localization
          ? localization.localeCodes
          : [req.locale ?? undefined]

      // A shared key update also changes indexes for locales outside the validation request.
      for (const locale of locales) {
        const indexData =
          hasLocalizedPartialIndex && locale
            ? flattenDataByLocale({
                configBlockReferences: req.payload.config.blocks,
                docWithLocales: dataWithLocales,
                fields: collection.fields,
                locale,
              })
            : data

        if (
          requiredFields.some(
            ({ path }) => !fieldPathExists({ data: indexData, segments: path.split('.') }),
          )
        ) {
          continue
        }

        const values = index.fields.map(({ path }) => ({
          path,
          value: getObjectDotNotation(indexData, path),
        }))

        if (
          !requiredFields.length &&
          values.some(({ value }) => value === null || typeof value === 'undefined')
        ) {
          continue
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
            field.pathHasLocalized && localization && locale
              ? field.localizedPath.replaceAll('<locale>', locale)
              : field.path,
          )
          const select: SelectIncludeType = unflatten(
            Object.fromEntries([['id', true], ...requiredFields.map(({ path }) => [path, true])]),
            { object: true },
          )

          const { docs } = await req.payload.db.find({
            collection: collection.slug,
            limit: 0,
            locale,
            pagination: false,
            req: queryReq,
            select,
            where,
          })

          exists = docs.some(
            (doc) =>
              doc.id !== id &&
              requiredPaths.every((path) =>
                fieldPathExists({ data: doc, segments: path.split('.') }),
              ),
          )
        } else {
          exists = await documentMatchingWhereExists({
            id,
            collection: collection.slug,
            locale,
            overrideAccess: true,
            req,
            where,
          })
        }

        if (exists) {
          return index
        }
      }

      return null
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

/** Checks whether a dotted field path exists, traversing array rows and counting null as present. */
function fieldPathExists({ data, segments }: { data: unknown; segments: string[] }): boolean {
  if (!segments.length) {
    return data !== undefined
  }

  if (Array.isArray(data)) {
    return data.some((row) => fieldPathExists({ data: row, segments }))
  }

  const [segment, ...remainingSegments] = segments

  return (
    data !== null &&
    typeof data === 'object' &&
    Object.hasOwn(data, segment!) &&
    fieldPathExists({
      data: (data as Record<string, unknown>)[segment!],
      segments: remainingSegments,
    })
  )
}
