import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { ValidationFieldError } from '../../../errors/index.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, Operation, PayloadRequest } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { deepMergeWithSourceArrays } from '../../../utilities/deepMerge.js'
import { getLabelFromPath } from '../../../utilities/getLabelFromPath.js'
import { getTranslatedLabel } from '../../../utilities/getTranslatedLabel.js'
import { fieldAffectsData, tabHasName } from '../../config/types.js'
import { getFieldPathsModified as getFieldPaths } from '../../getFieldPaths.js'
import { getExistingRowDoc } from './getExistingRowDoc.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  doc: JsonObject
  docWithLocales: JsonObject
  errors: ValidationFieldError[]
  field: Field | TabAsField
  fieldIndex: number
  global: null | SanitizedGlobalConfig
  id?: number | string
  mergeLocaleActions: (() => Promise<void>)[]
  operation: Operation
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
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
  fieldIndex,
  global,
  mergeLocaleActions,
  operation,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  req,
  siblingData,
  siblingDoc,
  siblingDocWithLocales,
  skipValidation,
}: Args): Promise<void> => {
  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: fieldIndex,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
  })

  const passesCondition = field.admin?.condition
    ? Boolean(field.admin.condition(data, siblingData, { user: req.user }))
    : true
  let skipValidationFromHere = skipValidation || !passesCondition
  const { localization } = req.payload.config
  const defaultLocale = localization ? localization?.defaultLocale : 'en'
  const operationLocale = req.locale || defaultLocale

  const pathSegments = path ? path.split('.') : []
  const schemaPathSegments = schemaPath ? schemaPath.split('.') : []
  const indexPathSegments = indexPath ? indexPath.split('-').filter(Boolean)?.map(Number) : []

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
          indexPath: indexPathSegments,
          operation,
          originalDoc: doc,
          path: pathSegments,
          previousSiblingDoc: siblingDoc,
          previousValue: siblingDoc[field.name],
          req,
          schemaPath: schemaPathSegments,
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
          event: 'submit',
          jsonError,
          operation,
          preferences: { fields: {} },
          previousValue: siblingDoc[field.name],
          req,
          siblingData: deepMergeWithSourceArrays(siblingDoc, siblingData),
        } as any,
      )

      if (typeof validationResult === 'string') {
        const label = getTranslatedLabel(field?.label || field?.name, req.i18n)
        const parentPathSegments = parentPath ? parentPath.split('.') : []

        const fieldLabel =
          Array.isArray(parentPathSegments) && parentPathSegments.length > 0
            ? getLabelFromPath(parentPathSegments.concat(label))
            : label

        errors.push({
          label: fieldLabel,
          message: validationResult,
          path,
        })
      }
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
    case 'array': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []

        rows.forEach((row, rowIndex) => {
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
              parentIndexPath: '',
              parentPath: path + '.' + rowIndex,
              parentSchemaPath: schemaPath,
              req,
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

        rows.forEach((row, rowIndex) => {
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
                parentIndexPath: '',
                parentPath: path + '.' + rowIndex,
                parentSchemaPath: schemaPath + '.' + block.slug,
                req,
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

    case 'collapsible':
    case 'row': {
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
        parentIndexPath: indexPath,
        parentPath,
        parentSchemaPath: schemaPath,
        req,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      })

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
        parentIndexPath: '',
        parentPath: path,
        parentSchemaPath: schemaPath,
        req,
        siblingData: siblingData[field.name] as JsonObject,
        siblingDoc: siblingDoc[field.name] as JsonObject,
        siblingDocWithLocales: siblingDocWithLocales[field.name] as JsonObject,
        skipValidation: skipValidationFromHere,
      })

      break
    }

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
            indexPath: indexPathSegments,
            mergeLocaleActions,
            operation,
            originalDoc: doc,
            path: pathSegments,
            previousSiblingDoc: siblingDoc,
            previousValue: siblingDoc[field.name],
            req,
            schemaPath: schemaPathSegments,
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

    case 'tab': {
      let tabSiblingData = siblingData
      let tabSiblingDoc = siblingDoc
      let tabSiblingDocWithLocales = siblingDocWithLocales

      const isNamedTab = tabHasName(field)

      if (isNamedTab) {
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
        parentIndexPath: isNamedTab ? '' : indexPath,
        parentPath: isNamedTab ? path : parentPath,
        parentSchemaPath: schemaPath,
        req,
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
        parentIndexPath: indexPath,
        parentPath: path,
        parentSchemaPath: schemaPath,
        req,
        siblingData,
        siblingDoc,
        siblingDocWithLocales,
        skipValidation: skipValidationFromHere,
      })

      break
    }

    default: {
      break
    }
  }
}
