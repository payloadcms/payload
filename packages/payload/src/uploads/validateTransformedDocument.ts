import { isDeepStrictEqual } from 'node:util'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { ValidationFieldError } from '../errors/ValidationError.js'
import type { Field } from '../fields/config/types.js'
import type { Document, PayloadRequest } from '../types/index.js'

import { ValidationError } from '../errors/ValidationError.js'
import { fieldAffectsData } from '../fields/config/types.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'

/** Validate transformer mutations after processing without repeating document or field hooks. */
export async function validateTransformedDocument({
  collection,
  doc,
  operation,
  originalDoc,
  overrideAccess = false,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: Document
  operation: 'create' | 'update'
  originalDoc: Document
  overrideAccess?: boolean
  req: PayloadRequest
}): Promise<void> {
  const errors: ValidationFieldError[] = []

  await visit({ data: doc, fields: collection.fields, path: [], previous: originalDoc })

  if (errors.length) {
    throw new ValidationError({ collection: collection.slug, errors, req }, req.t)
  }

  async function visit({
    data,
    fields,
    path,
    previous,
  }: {
    data: Document
    fields: Field[]
    path: (number | string)[]
    previous: Document
  }): Promise<void> {
    if (!data || typeof data !== 'object') {
      return
    }
    for (const field of fields) {
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          await visit({
            data: 'name' in tab ? data[tab.name] : data,
            fields: tab.fields,
            path: 'name' in tab ? [...path, tab.name] : path,
            previous: 'name' in tab ? previous?.[tab.name] : previous,
          })
        }
        continue
      }
      if (!fieldAffectsData(field)) {
        if ('fields' in field) {
          await visit({ data, fields: field.fields, path, previous })
        }
        continue
      }

      const value = data[field.name]
      const previousValue = previous?.[field.name]
      const fieldPath = [...path, field.name]

      if (isDeepStrictEqual(value, previousValue)) {
        continue
      }

      const values =
        field.localized && req.payload.config.localization
          ? req.payload.config.localization.localeCodes.map((locale) => ({
              locale,
              previousValue: previousValue?.[locale],
              value: value?.[locale],
            }))
          : [{ locale: undefined, previousValue, value }]

      for (const entry of values) {
        const validationReq = entry.locale
          ? Object.assign(Object.create(req), { fallbackLocale: null, locale: entry.locale })
          : req
        if ('validate' in field && typeof field.validate === 'function') {
          const result = await field.validate(
            entry.value as never,
            {
              ...field,
              id: doc.id,
              collectionSlug: collection.slug,
              data: deepCopyObjectSimple(doc),
              event: 'submit',
              operation,
              overrideAccess,
              path: fieldPath,
              preferences: { fields: {} },
              previousValue: entry.previousValue,
              req: validationReq,
              siblingData: deepCopyObjectSimple(data),
            } as never,
          )

          if (typeof result === 'string') {
            errors.push({ message: result, path: fieldPath.join('.') })
          }
        }
        if ('fields' in field && field.type !== 'array') {
          await visit({
            data: entry.value,
            fields: field.fields,
            path: fieldPath,
            previous: entry.previousValue,
          })
        }
        if ((field.type === 'array' || field.type === 'blocks') && Array.isArray(entry.value)) {
          for (const [index, row] of entry.value.entries()) {
            const rowFields =
              field.type === 'array'
                ? field.fields
                : (field.blocks.find(
                    (block) => typeof block !== 'string' && block.slug === row.blockType,
                  ) ?? req.payload.blocks[row.blockType])
            await visit({
              data: row,
              fields: Array.isArray(rowFields)
                ? rowFields
                : typeof rowFields === 'object'
                  ? rowFields.fields
                  : [],
              path: [...fieldPath, index],
              previous: entry.previousValue?.[index],
            })
          }
        }
      }
    }
  }
}
