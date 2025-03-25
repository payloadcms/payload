// @ts-strict-ignore
import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { ValidationFieldError } from '../../../errors/index.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, Operation, PayloadRequest } from '../../../types/index.js'
import type { Block, Field, TabAsField, Validate } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { deepMergeWithSourceArrays } from '../../../utilities/deepMerge.js'
import { getTranslatedLabel } from '../../../utilities/getTranslatedLabel.js'
import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../../config/types.js'
import { getFieldPathsModified as getFieldPaths } from '../../getFieldPaths.js'
import { getExistingRowDoc } from './getExistingRowDoc.js'
import { traverseFields } from './traverseFields.js'

function buildFieldLabel(parentLabel: string, label: string): string {
  const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)
  return parentLabel && capitalizedLabel
    ? `${parentLabel} > ${capitalizedLabel}`
    : capitalizedLabel || parentLabel
}

type Args = {
  /**
   * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
   */
  blockData?: JsonObject
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  doc: JsonObject
  docWithLocales: JsonObject
  errors: ValidationFieldError[]
  field: Field | TabAsField
  fieldIndex: number
  /**
   * Built up labels of parent fields
   *
   * @example "Group Field > Tab Field > Text Field"
   */
  fieldLabelPath: string
  global: null | SanitizedGlobalConfig
  id?: number | string
  mergeLocaleActions: (() => Promise<void> | void)[]
  operation: Operation
  parentIndexPath: string
  parentIsLocalized: boolean
  parentPath: string
  parentSchemaPath: string
  req: PayloadRequest
  siblingData: JsonObject
  siblingDoc: JsonObject
  siblingDocWithLocales?: JsonObject
  siblingFields?: (Field | TabAsField)[]
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
  blockData,
  collection,
  context,
  data,
  doc,
  docWithLocales,
  errors,
  field,
  fieldIndex,
  fieldLabelPath,
  global,
  mergeLocaleActions,
  operation,
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  req,
  siblingData,
  siblingDoc,
  siblingDocWithLocales,
  siblingFields,
  skipValidation,
}: Args): Promise<void> => {
  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: fieldIndex,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
  })

  const { localization } = req.payload.config
  const defaultLocale = localization ? localization?.defaultLocale : 'en'
  const operationLocale = req.locale || defaultLocale

  const pathSegments = path ? path.split('.') : []
  const schemaPathSegments = schemaPath ? schemaPath.split('.') : []
  const indexPathSegments = indexPath ? indexPath.split('-').filter(Boolean)?.map(Number) : []

  const passesCondition = field.admin?.condition
    ? Boolean(
        field.admin.condition(data, siblingData, { blockData, path: pathSegments, user: req.user }),
      )
    : true
  let skipValidationFromHere = skipValidation || !passesCondition

  if (fieldAffectsData(field)) {
    // skip validation if the field is localized and the incoming data is null
    if (fieldShouldBeLocalized({ field, parentIsLocalized }) && operationLocale !== defaultLocale) {
      if (['array', 'blocks'].includes(field.type) && siblingData[field.name] === null) {
        skipValidationFromHere = true
      }
    }

    // Execute hooks
    if (field.hooks?.beforeChange) {
      for (const hook of field.hooks.beforeChange) {
        const hookedValue = await hook({
          blockData,
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
          siblingFields,
          value: siblingData[field.name],
        })

        if (hookedValue !== undefined) {
          siblingData[field.name] = hookedValue
        }
      }
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

      const validateFn: Validate<object, object, object, object> = field.validate as Validate<
        object,
        object,
        object,
        object
      >
      const validationResult = await validateFn(valueToValidate as never, {
        ...field,
        id,
        blockData,
        collectionSlug: collection?.slug,
        data: deepMergeWithSourceArrays(doc, data),
        event: 'submit',
        // @ts-expect-error
        jsonError,
        operation,
        path: pathSegments,
        preferences: { fields: {} },
        previousValue: siblingDoc[field.name],
        req,
        siblingData: deepMergeWithSourceArrays(siblingDoc, siblingData),
      })

      if (typeof validationResult === 'string') {
        const fieldLabel = buildFieldLabel(
          fieldLabelPath,
          getTranslatedLabel(field?.label || field?.name, req.i18n),
        )

        errors.push({
          label: fieldLabel,
          message: validationResult,
          path,
        })
      }
    }

    // Push merge locale action if applicable
    if (localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
      mergeLocaleActions.push(() => {
        const localeData = {}

        for (const locale of localization.localeCodes) {
          const fieldValue =
            locale === req.locale
              ? siblingData[field.name]
              : siblingDocWithLocales?.[field.name]?.[locale]

          // update locale value if it's not undefined
          if (typeof fieldValue !== 'undefined') {
            localeData[locale] = fieldValue
          }
        }

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
              blockData,
              collection,
              context,
              data,
              doc,
              docWithLocales,
              errors,
              fieldLabelPath:
                field?.label === false
                  ? fieldLabelPath
                  : buildFieldLabel(
                      fieldLabelPath,
                      `${getTranslatedLabel(field?.label || field?.name, req.i18n)} ${rowIndex + 1}`,
                    ),
              fields: field.fields,
              global,
              mergeLocaleActions,
              operation,
              parentIndexPath: '',
              parentIsLocalized: parentIsLocalized || field.localized,
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

          const block: Block | undefined =
            req.payload.blocks[blockTypeToMatch] ??
            ((field.blockReferences ?? field.blocks).find(
              (curBlock) => typeof curBlock !== 'string' && curBlock.slug === blockTypeToMatch,
            ) as Block | undefined)

          if (block) {
            promises.push(
              traverseFields({
                id,
                blockData: row,
                collection,
                context,
                data,
                doc,
                docWithLocales,
                errors,
                fieldLabelPath:
                  field?.label === false
                    ? fieldLabelPath
                    : buildFieldLabel(
                        fieldLabelPath,
                        `${getTranslatedLabel(field?.label || field?.name, req.i18n)} ${rowIndex + 1}`,
                      ),
                fields: block.fields,
                global,
                mergeLocaleActions,
                operation,
                parentIndexPath: '',
                parentIsLocalized: parentIsLocalized || field.localized,
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
        blockData,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fieldLabelPath:
          field.type === 'row' || field?.label === false
            ? fieldLabelPath
            : buildFieldLabel(
                fieldLabelPath,
                getTranslatedLabel(field?.label || field?.type, req.i18n),
              ),
        fields: field.fields,
        global,
        mergeLocaleActions,
        operation,
        parentIndexPath: indexPath,
        parentIsLocalized,
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
        blockData,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fieldLabelPath:
          field?.label === false
            ? fieldLabelPath
            : buildFieldLabel(
                fieldLabelPath,
                getTranslatedLabel(field?.label || field?.name, req.i18n),
              ),
        fields: field.fields,
        global,
        mergeLocaleActions,
        operation,
        parentIndexPath: '',
        parentIsLocalized: parentIsLocalized || field.localized,
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
        for (const hook of editor.hooks.beforeChange) {
          const hookedValue = await hook({
            collection,
            context,
            data,
            docWithLocales,
            errors,
            field,
            fieldLabelPath:
              field?.label === false
                ? fieldLabelPath
                : buildFieldLabel(
                    fieldLabelPath,
                    getTranslatedLabel(field?.label || field?.name, req.i18n),
                  ),
            global,
            indexPath: indexPathSegments,
            mergeLocaleActions,
            operation,
            originalDoc: doc,
            parentIsLocalized,
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
        }
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
        blockData,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fieldLabelPath:
          field?.label === false
            ? fieldLabelPath
            : buildFieldLabel(
                fieldLabelPath,
                getTranslatedLabel(field?.label || field?.name, req.i18n),
              ),
        fields: field.fields,
        global,
        mergeLocaleActions,
        operation,
        parentIndexPath: isNamedTab ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || field.localized,
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
        blockData,
        collection,
        context,
        data,
        doc,
        docWithLocales,
        errors,
        fieldLabelPath:
          field?.label === false
            ? fieldLabelPath
            : buildFieldLabel(fieldLabelPath, getTranslatedLabel(field?.label || '', req.i18n)),
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        global,
        mergeLocaleActions,
        operation,
        parentIndexPath: indexPath,
        parentIsLocalized,
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
