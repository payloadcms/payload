import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, FieldHookArgs, TabAsField } from '../../config/types.js'

import { fieldAffectsData } from '../../config/types.js'
import { getFieldPathsModified as getFieldPaths } from '../../getFieldPaths.js'
import { runBeforeDuplicateHooks } from './runHook.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  doc: T
  field: Field | TabAsField
  fieldIndex: number
  id?: number | string
  overrideAccess: boolean
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
  req: PayloadRequest
  siblingDoc: JsonObject
}

export const promise = async <T>({
  id,
  collection,
  context,
  doc,
  field,
  fieldIndex,
  overrideAccess,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  req,
  siblingDoc,
}: Args<T>): Promise<void> => {
  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: fieldIndex,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
  })

  const { localization } = req.payload.config

  const pathSegments = path ? path.split('.') : []
  const schemaPathSegments = schemaPath ? schemaPath.split('.') : []
  const indexPathSegments = indexPath ? indexPath.split('-').filter(Boolean)?.map(Number) : []

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
              indexPath: indexPathSegments,
              path: pathSegments,
              previousSiblingDoc: siblingDoc,
              previousValue: siblingDoc[field.name]?.[locale],
              req,
              schemaPath: schemaPathSegments,
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
          indexPath: indexPathSegments,
          path: pathSegments,
          previousSiblingDoc: siblingDoc,
          previousValue: siblingDoc[field.name],
          req,
          schemaPath: schemaPathSegments,
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
            case 'array': {
              const rows = fieldData[locale]

              if (Array.isArray(rows)) {
                const promises = []

                rows.forEach((row, rowIndex) => {
                  promises.push(
                    traverseFields({
                      id,
                      collection,
                      context,
                      doc,
                      fields: field.fields,
                      overrideAccess,
                      parentIndexPath: '',
                      parentPath: path + '.' + rowIndex,
                      parentSchemaPath: schemaPath,
                      req,
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

                rows.forEach((row, rowIndex) => {
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
                      parentIndexPath: '',
                      parentPath: path + '.' + rowIndex,
                      parentSchemaPath: schemaPath + '.' + block.slug,
                      req,
                      siblingDoc: row,
                    }),
                  )
                })
              }
              break
            }

            case 'group':
            case 'tab': {
              promises.push(
                traverseFields({
                  id,
                  collection,
                  context,
                  doc,
                  fields: field.fields,
                  overrideAccess,
                  parentIndexPath: '',
                  parentPath: path,
                  parentSchemaPath: schemaPath,
                  req,
                  siblingDoc: fieldData[locale],
                }),
              )

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
        case 'array': {
          const rows = siblingDoc[field.name]

          if (Array.isArray(rows)) {
            const promises = []

            rows.forEach((row, rowIndex) => {
              promises.push(
                traverseFields({
                  id,
                  collection,
                  context,
                  doc,
                  fields: field.fields,
                  overrideAccess,
                  parentIndexPath: '',
                  parentPath: path + '.' + rowIndex,
                  parentSchemaPath: schemaPath,
                  req,
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

            rows.forEach((row, rowIndex) => {
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
                    parentIndexPath: '',
                    parentPath: path + '.' + rowIndex,
                    parentSchemaPath: schemaPath + '.' + block.slug,
                    req,
                    siblingDoc: row,
                  }),
                )
              }
            })

            await Promise.all(promises)
          }

          break
        }

        case 'group': {
          if (typeof siblingDoc[field.name] !== 'object') {
            siblingDoc[field.name] = {}
          }

          const groupDoc = siblingDoc[field.name] as JsonObject

          await traverseFields({
            id,
            collection,
            context,
            doc,
            fields: field.fields,
            overrideAccess,
            parentIndexPath: '',
            parentPath: path,
            parentSchemaPath: schemaPath,
            req,
            siblingDoc: groupDoc,
          })

          break
        }

        case 'tab': {
          if (typeof siblingDoc[field.name] !== 'object') {
            siblingDoc[field.name] = {}
          }

          const tabDoc = siblingDoc[field.name] as JsonObject

          await traverseFields({
            id,
            collection,
            context,
            doc,
            fields: field.fields,
            overrideAccess,
            parentIndexPath: '',
            parentPath: path,
            parentSchemaPath: schemaPath,
            req,
            siblingDoc: tabDoc,
          })

          break
        }
      }
    }
  } else {
    // Finally, we traverse fields which do not affect data here
    switch (field.type) {
      case 'collapsible':
      case 'row': {
        await traverseFields({
          id,
          collection,
          context,
          doc,
          fields: field.fields,
          overrideAccess,
          parentIndexPath: indexPath,
          parentPath,
          parentSchemaPath: schemaPath,
          req,
          siblingDoc,
        })

        break
      }

      // Unnamed Tab
      // @ts-expect-error `fieldAffectsData` inferred return type doesn't account for TabAsField
      case 'tab': {
        await traverseFields({
          id,
          collection,
          context,
          doc,
          // @ts-expect-error `fieldAffectsData` inferred return type doesn't account for TabAsField
          fields: field.fields,
          overrideAccess,
          parentIndexPath: indexPath,
          parentPath,
          parentSchemaPath: schemaPath,
          req,
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
          parentIndexPath: indexPath,
          parentPath: path,
          parentSchemaPath: schemaPath,
          req,
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
