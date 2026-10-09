import { isDeepStrictEqual } from 'node:util'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { ValidationFieldError } from '../errors/ValidationError.js'
import type { Field, Validate } from '../fields/config/types.js'
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
    blockData,
    data,
    fields,
    hasChangedAncestor = false,
    path,
    previous,
  }: {
    blockData?: Document
    data: Document
    fields: Field[]
    hasChangedAncestor?: boolean
    path: (number | string)[]
    previous: Document
  }): Promise<void> {
    data = data && typeof data === 'object' ? data : {}
    for (const field of fields) {
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          await visit({
            blockData,
            data: 'name' in tab ? data[tab.name] : data,
            fields: tab.fields,
            hasChangedAncestor:
              hasChangedAncestor ||
              ('name' in tab && !isDeepStrictEqual(data[tab.name], previous?.[tab.name])),
            path: 'name' in tab ? [...path, tab.name] : path,
            previous: 'name' in tab ? previous?.[tab.name] : previous,
          })
        }
        continue
      }
      if (!fieldAffectsData(field)) {
        if ('fields' in field) {
          await visit({ blockData, data, fields: field.fields, hasChangedAncestor, path, previous })
        }
        continue
      }

      const value = data[field.name]
      const previousValue = previous?.[field.name]
      const fieldPath = [...path, field.name]

      if (!hasChangedAncestor && isDeepStrictEqual(value, previousValue)) {
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
          const validate = field.validate as Validate<unknown, Document, Document, Document>
          const result = await validate(entry.value, {
            ...field,
            id: doc.id,
            blockData,
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
          })

          if (typeof result === 'string') {
            errors.push({ message: result, path: fieldPath.join('.') })
          }
        }
        if ('fields' in field && field.type !== 'array') {
          await visit({
            blockData,
            data: entry.value,
            fields: field.fields,
            hasChangedAncestor: true,
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
              blockData: field.type === 'blocks' ? row : blockData,
              data: row,
              fields: Array.isArray(rowFields)
                ? rowFields
                : typeof rowFields === 'object'
                  ? rowFields.fields
                  : [],
              hasChangedAncestor,
              path: [...fieldPath, index],
              previous: entry.previousValue?.[index],
            })
          }
        }
      }
    }
  }
}
