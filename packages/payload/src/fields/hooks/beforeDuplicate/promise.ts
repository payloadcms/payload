import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { JsonObject, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { Field, FieldHookArgs, TabAsField } from '../../config/types.js'

import { fieldAffectsData, tabHasName } from '../../config/types.js'
import { getFieldPaths } from '../../getFieldPaths.js'
import { runBeforeDuplicateHooks } from './runHook.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  doc: T
  field: Field | TabAsField
  id?: number | string
  overrideAccess: boolean
  parentPath: (number | string)[]
  parentSchemaPath: string[]
  req: PayloadRequest
  siblingDoc: JsonObject
}

export const promise = async <T>({
  id,
  collection,
  context,
  doc,
  field,
  overrideAccess,
  parentPath,
  parentSchemaPath,
  req,
  siblingDoc,
}: Args<T>): Promise<void> => {
  const { localization } = req.payload.config

  const { path: fieldPath, schemaPath: fieldSchemaPath } = getFieldPaths({
    field,
    parentPath,
    parentSchemaPath,
  })

  // Handle unnamed tabs
  if (field.type === 'tab' && !tabHasName(field)) {
    await traverseFields({
      id,
      collection,
      context,
      doc,
      fields: field.fields,
      overrideAccess,
      path: fieldPath,
      req,
      schemaPath: fieldSchemaPath,
      siblingDoc,
    })

    return
  }

  if (fieldAffectsData(field)) {
    let fieldData = siblingDoc?.[field.name]
    const fieldIsLocalized = field.localized && localization

    // Run field beforeDuplicate hooks
    if (Array.isArray(field.hooks?.beforeDuplicate)) {
      if (fieldIsLocalized) {
        const localeData = await localization.localeCodes.reduce(
          async (localizedValuesPromise: Promise<JsonObject>, locale) => {
            const localizedValues = await localizedValuesPromise

            const beforeDuplicateArgs: FieldHookArgs = {
              collection,
              context,
              data: doc,
              field,
              global: undefined,
              path: fieldPath,
              previousSiblingDoc: siblingDoc,
              previousValue: siblingDoc[field.name]?.[locale],
              req,
              schemaPath: parentSchemaPath,
              siblingData: siblingDoc,
              siblingDocWithLocales: siblingDoc,
              value: siblingDoc[field.name]?.[locale],
            }

            const hookResult = await runBeforeDuplicateHooks(beforeDuplicateArgs)

            if (typeof hookResult !== 'undefined') {
              return {
                ...localizedValues,
                [locale]: hookResult,
              }
            }

            return localizedValuesPromise
          },
          Promise.resolve({}),
        )

        siblingDoc[field.name] = localeData
      } else {
        const beforeDuplicateArgs: FieldHookArgs = {
          collection,
          context,
          data: doc,
          field,
          global: undefined,
          path: fieldPath,
          previousSiblingDoc: siblingDoc,
          previousValue: siblingDoc[field.name],
          req,
          schemaPath: parentSchemaPath,
          siblingData: siblingDoc,
          siblingDocWithLocales: siblingDoc,
          value: siblingDoc[field.name],
        }

        const hookResult = await runBeforeDuplicateHooks(beforeDuplicateArgs)
        if (typeof hookResult !== 'undefined') {
          siblingDoc[field.name] = hookResult
        }
      }
    }

    // First, for any localized fields, we will loop over locales
    // and if locale data is present, traverse the sub fields.
    // There are only a few different fields where this is possible.
    if (fieldIsLocalized) {
      if (typeof fieldData !== 'object' || fieldData === null) {
        siblingDoc[field.name] = {}
        fieldData = siblingDoc[field.name]
      }

      const promises = []

      localization.localeCodes.forEach((locale) => {
        if (fieldData[locale]) {
          switch (field.type) {
            case 'tab':
            case 'group': {
              promises.push(
                traverseFields({
                  id,
                  collection,
                  context,
                  doc,
                  fields: field.fields,
                  overrideAccess,
                  path: fieldSchemaPath,
                  req,
                  schemaPath: fieldSchemaPath,
                  siblingDoc: fieldData[locale],
                }),
              )

              break
            }

            case 'array': {
              const rows = fieldData[locale]

              if (Array.isArray(rows)) {
                const promises = []
                rows.forEach((row, i) => {
                  promises.push(
                    traverseFields({
                      id,
                      collection,
                      context,
                      doc,
                      fields: field.fields,
                      overrideAccess,
                      path: [...fieldPath, i],
                      req,
                      schemaPath: fieldSchemaPath,
                      siblingDoc: row,
                    }),
                  )
                })
              }
              break
            }

            case 'blocks': {
              const rows = fieldData[locale]

              if (Array.isArray(rows)) {
                const promises = []
                rows.forEach((row, i) => {
                  const blockTypeToMatch = row.blockType

                  const block = field.blocks.find(
                    (blockType) => blockType.slug === blockTypeToMatch,
                  )

                  promises.push(
                    traverseFields({
                      id,
                      collection,
                      context,
                      doc,
                      fields: block.fields,
                      overrideAccess,
                      path: [...fieldPath, i],
                      req,
                      schemaPath: fieldSchemaPath,
                      siblingDoc: row,
                    }),
                  )
                })
              }
              break
            }
          }
        }
      })

      await Promise.all(promises)
    } else {
      // If the field is not localized, but it affects data,
      // we need to further traverse its children
      // so the child fields can run beforeDuplicate hooks
      switch (field.type) {
        case 'tab':
        case 'group': {
          if (typeof siblingDoc[field.name] !== 'object') {
            siblingDoc[field.name] = {}
          }

          const groupDoc = siblingDoc[field.name] as Record<string, unknown>

          await traverseFields({
            id,
            collection,
            context,
            doc,
            fields: field.fields,
            overrideAccess,
            path: fieldPath,
            req,
            schemaPath: fieldSchemaPath,
            siblingDoc: groupDoc as JsonObject,
          })

          break
        }

        case 'array': {
          const rows = siblingDoc[field.name]

          if (Array.isArray(rows)) {
            const promises = []
            rows.forEach((row, i) => {
              promises.push(
                traverseFields({
                  id,
                  collection,
                  context,
                  doc,
                  fields: field.fields,
                  overrideAccess,
                  path: [...fieldPath, i],
                  req,
                  schemaPath: fieldSchemaPath,
                  siblingDoc: row,
                }),
              )
            })
            await Promise.all(promises)
          }
          break
        }

        case 'blocks': {
          const rows = siblingDoc[field.name]

          if (Array.isArray(rows)) {
            const promises = []
            rows.forEach((row, i) => {
              const blockTypeToMatch = row.blockType
              const block = field.blocks.find((blockType) => blockType.slug === blockTypeToMatch)

              if (block) {
                ;(row as JsonObject).blockType = blockTypeToMatch

                promises.push(
                  traverseFields({
                    id,
                    collection,
                    context,
                    doc,
                    fields: block.fields,
                    overrideAccess,
                    path: [...fieldPath, i],
                    req,
                    schemaPath: fieldSchemaPath,
                    siblingDoc: row,
                  }),
                )
              }
            })
            await Promise.all(promises)
          }

          break
        }
      }
    }
  } else {
    // Finally, we traverse fields which do not affect data here
    switch (field.type) {
      case 'row':
      case 'collapsible': {
        await traverseFields({
          id,
          collection,
          context,
          doc,
          fields: field.fields,
          overrideAccess,
          path: fieldPath,
          req,
          schemaPath: fieldSchemaPath,
          siblingDoc,
        })

        break
      }

      case 'tabs': {
        await traverseFields({
          id,
          collection,
          context,
          doc,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          overrideAccess,
          path: fieldPath,
          req,
          schemaPath: fieldSchemaPath,
          siblingDoc,
        })

        break
      }

      default: {
        break
      }
    }
  }
}
