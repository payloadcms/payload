import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, Operation, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { Field, FieldHookArgs, TabAsField, ValidateOptions } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { deepMergeWithSourceArrays } from '../../../utilities/deepMerge.js'
import { fieldAffectsData, tabHasName } from '../../config/types.js'
import { getFieldPaths } from '../../getFieldPaths.js'
import { getExistingRowDoc } from './getExistingRowDoc.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  doc: JsonObject
  docWithLocales: JsonObject
  errors: { field: string; message: string }[]
  field: Field | TabAsField
  global: null | SanitizedGlobalConfig
  id?: number | string
  mergeLocaleActions: (() => Promise<void>)[]
  operation: Operation
  /**
   * The parent's path.
   */
  parentPath: (number | string)[]
  /**
   * The parent's schemaPath (path without indexes).
   */
  parentSchemaPath: string[]
  req: PayloadRequest
  siblingData: JsonObject
  siblingDoc: JsonObject
  siblingDocWithLocales?: JsonObject
  skipValidation: boolean
}

// This function is responsible for the following actions, in order:
// - Run condition
// - Execute field hooks
// - Validate data
// - Transform data for storage
// - beforeDuplicate hooks (if duplicate)
// - Unflatten locales

export const promise = async ({
  id,
  collection,
  context,
  data,
  doc,
  docWithLocales,
  errors,
  field,
  global,
  mergeLocaleActions,
  operation,
  parentPath,
  parentSchemaPath,
  req,
  siblingData,
  siblingDoc,
  siblingDocWithLocales,
  skipValidation,
}: Args): Promise<void> => {
  const passesCondition = field.admin?.condition
    ? Boolean(field.admin.condition(data, siblingData, { user: req.user }))
    : true

  let skipValidationFromHere = skipValidation || !passesCondition
  const { localization } = req.payload.config
  const defaultLocale = localization ? localization?.defaultLocale : 'en'
  const operationLocale = req.locale || defaultLocale

  const { path: fieldPath, schemaPath: fieldSchemaPath } = getFieldPaths({
    field,
    parentPath,
    parentSchemaPath,
  })

  if (fieldAffectsData(field)) {
    // skip validation if the field is localized and the incoming data is null
    if (field.localized && operationLocale !== defaultLocale) {
      if (['array', 'blocks'].includes(field.type) && siblingData[field.name] === null) {
        skipValidationFromHere = true
      }
    }

    // Execute hooks
    if (field.hooks?.beforeChange) {
      await field.hooks.beforeChange.reduce(async (priorHook, currentHook) => {
        await priorHook

        const hookedValue = await currentHook({
          collection,
          context,
          data,
          field,
          global,
          operation,
          originalDoc: doc,
          path: fieldPath,
          previousSiblingDoc: siblingDoc,
          previousValue: siblingDoc[field.name],
          req,
          schemaPath: parentSchemaPath,
          siblingData,
          siblingDocWithLocales,
          value: siblingData[field.name],
        })

        if (hookedValue !== undefined) {
          siblingData[field.name] = hookedValue
        }
      }, Promise.resolve())
    }

    // Validate
    if (!skipValidationFromHere && 'validate' in field && field.validate) {
      const valueToValidate = siblingData[field.name]
      let jsonError: object

      if (field.type === 'json' && typeof siblingData[field.name] === 'string') {
        try {
          JSON.parse(siblingData[field.name] as string)
        } catch (e) {
          jsonError = e
        }
      }

      const validationResult = await field.validate(
        valueToValidate as never,
        {
          ...field,
          id,
          collectionSlug: collection?.slug,
          data: deepMergeWithSourceArrays(doc, data),
          jsonError,
          operation,
          preferences: { fields: {} },
          previousValue: siblingDoc[field.name],
          req,
          siblingData: deepMergeWithSourceArrays(siblingDoc, siblingData),
        } as any,
      )

      if (typeof validationResult === 'string') {
        errors.push({
          field: fieldPath.join('.'),
          message: validationResult,
        })
      }
    }

    const beforeDuplicateArgs: FieldHookArgs = {
      collection,
      context,
      data,
      field,
      global: undefined,
      path: fieldPath,
      previousSiblingDoc: siblingDoc,
      previousValue: siblingDoc[field.name],
      req,
      schemaPath: parentSchemaPath,
      siblingData,
      siblingDocWithLocales,
      value: siblingData[field.name],
    }

    // Push merge locale action if applicable
    if (localization && field.localized) {
      mergeLocaleActions.push(async () => {
        const localeData = await localization.localeCodes.reduce(
          async (localizedValuesPromise: Promise<JsonObject>, locale) => {
            const localizedValues = await localizedValuesPromise
            const fieldValue =
              locale === req.locale
                ? siblingData[field.name]
                : siblingDocWithLocales?.[field.name]?.[locale]

            // const result = await localizedValues
            // update locale value if it's not undefined
            if (typeof fieldValue !== 'undefined') {
              return {
                ...localizedValues,
                [locale]: fieldValue,
              }
            }

            return localizedValuesPromise
          },
          Promise.resolve({}),
        )

        // If there are locales with data, set the data
        if (Object.keys(localeData).length > 0) {
          siblingData[field.name] = localeData
        }
      })
    }
  }

  switch (field.type) {
    case 'point': {
      // Transform point data for storage
      if (
        Array.isArray(siblingData[field.name]) &&
        siblingData[field.name][0] !== null &&
        siblingData[field.name][1] !== null
      ) {
        siblingData[field.name] = {
          type: 'Point',
          coordinates: [
            parseFloat(siblingData[field.name][0]),
            parseFloat(siblingData[field.name][1]),
          ],
        }
      }

      break
    }

    case 'group': {
      if (typeof siblingData[field.name] !== 'object') {
        siblingData[field.name] = {}
      }
      if (typeof siblingDoc[field.name] !== 'object') {
        siblingDoc[field.name] = {}
      }
      if (typeof siblingDocWithLocales[field.name] !== 'object') {
        siblingDocWithLocales[field.name] = {}
      }

      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.fields,
        global,
        mergeLocaleActions,
        operation,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData: siblingData[field.name] as JsonObject,
        siblingDoc: siblingDoc[field.name] as JsonObject,
        siblingDocWithLocales: siblingDocWithLocales[field.name] as JsonObject,
        skipValidation: skipValidationFromHere,
      })

      break
    }

    case 'array': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row, i) => {
          promises.push(
            traverseFields({
              id,
              collection,
              context,
              data,
              doc,
              docWithLocales,
              errors,
              fields: field.fields,
              global,
              mergeLocaleActions,
              operation,
              path: [...fieldPath, i],
              req,
              schemaPath: fieldSchemaPath,
              siblingData: row as JsonObject,
              siblingDoc: getExistingRowDoc(row as JsonObject, siblingDoc[field.name]),
              siblingDocWithLocales: getExistingRowDoc(
                row as JsonObject,
                siblingDocWithLocales[field.name],
              ),
              skipValidation: skipValidationFromHere,
            }),
          )
        })

        await Promise.all(promises)
      }

      break
    }

    case 'blocks': {
      const rows = siblingData[field.name]
      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row, i) => {
          const rowSiblingDoc = getExistingRowDoc(row as JsonObject, siblingDoc[field.name])
          const rowSiblingDocWithLocales = getExistingRowDoc(
            row as JsonObject,
            siblingDocWithLocales ? siblingDocWithLocales[field.name] : {},
          )

          const blockTypeToMatch = (row as JsonObject).blockType || rowSiblingDoc.blockType
          const block = field.blocks.find((blockType) => blockType.slug === blockTypeToMatch)

          if (block) {
            promises.push(
              traverseFields({
                id,
                collection,
                context,
                data,
                doc,
                docWithLocales,
                errors,
                fields: block.fields,
                global,
                mergeLocaleActions,
                operation,
                path: [...fieldPath, i],
                req,
                schemaPath: fieldSchemaPath,
                siblingData: row as JsonObject,
                siblingDoc: rowSiblingDoc,
                siblingDocWithLocales: rowSiblingDocWithLocales,
                skipValidation: skipValidationFromHere,
              }),
            )
          }
        })

        await Promise.all(promises)
      }

      break
    }

    case 'row':
    case 'collapsible': {
      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.fields,
        global,
        mergeLocaleActions,
        operation,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      })

      break
    }

    case 'tab': {
      let tabSiblingData = siblingData
      let tabSiblingDoc = siblingDoc
      let tabSiblingDocWithLocales = siblingDocWithLocales

      if (tabHasName(field)) {
        if (typeof siblingData[field.name] !== 'object') {
          siblingData[field.name] = {}
        }
        if (typeof siblingDoc[field.name] !== 'object') {
          siblingDoc[field.name] = {}
        }
        if (typeof siblingDocWithLocales[field.name] !== 'object') {
          siblingDocWithLocales[field.name] = {}
        }

        tabSiblingData = siblingData[field.name] as JsonObject
        tabSiblingDoc = siblingDoc[field.name] as JsonObject
        tabSiblingDocWithLocales = siblingDocWithLocales[field.name] as JsonObject
      }

      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.fields,
        global,
        mergeLocaleActions,
        operation,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData: tabSiblingData,
        siblingDoc: tabSiblingDoc,
        siblingDocWithLocales: tabSiblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      })

      break
    }

    case 'tabs': {
      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        global,
        mergeLocaleActions,
        operation,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      })

      break
    }

    case 'richText': {
      if (!field?.editor) {
        throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
      }
      if (typeof field?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }

      const editor: RichTextAdapter = field?.editor

      if (editor?.hooks?.beforeChange?.length) {
        await editor.hooks.beforeChange.reduce(async (priorHook, currentHook) => {
          await priorHook

          const hookedValue = await currentHook({
            collection,
            context,
            data,
            docWithLocales,
            errors,
            field,
            global,
            mergeLocaleActions,
            operation,
            originalDoc: doc,
            path: fieldPath,
            previousSiblingDoc: siblingDoc,
            previousValue: siblingDoc[field.name],
            req,
            schemaPath: parentSchemaPath,
            siblingData,
            siblingDocWithLocales,
            skipValidation,
            value: siblingData[field.name],
          })

          if (hookedValue !== undefined) {
            siblingData[field.name] = hookedValue
          }
        }, Promise.resolve())
      }

      break
    }

    default: {
      break
    }
  }
}
