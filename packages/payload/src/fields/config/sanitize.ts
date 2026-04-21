import { deepMergeSimple } from '@payloadcms/translations/utilities'

import type {
  CollectionConfig,
  SanitizedJoin,
  SanitizedJoins,
} from '../../collections/config/types.js'
import type { Config, SanitizedConfig } from '../../config/types.js'
import type { GlobalConfig } from '../../globals/config/types.js'
import type { OrderableJoinInfo } from './sanitizeJoinField.js'
import type { Field } from './types.js'

import {
  DuplicateFieldName,
  InvalidConfiguration,
  InvalidFieldName,
  InvalidFieldRelationship,
  MissingEditorProp,
  MissingFieldType,
} from '../../errors/index.js'
import { ReservedFieldName } from '../../errors/ReservedFieldName.js'
import { flattenAllFields } from '../../utilities/flattenAllFields.js'
import { formatLabels, toWords } from '../../utilities/formatLabels.js'
import { validateTimezones } from '../../utilities/validateTimezones.js'
import { baseBlockFields } from '../baseFields/baseBlockFields.js'
import { baseIDField } from '../baseFields/baseIDField.js'
import { baseTimezoneField } from '../baseFields/timezone/baseField.js'
import { defaultTimezones } from '../baseFields/timezone/defaultTimezones.js'
import { getFieldPaths } from '../getFieldPaths.js'
import { setDefaultBeforeDuplicate } from '../setDefaultBeforeDuplicate.js'
import { validations } from '../validations.js'
import {
  reservedAPIKeyFieldNames,
  reservedBaseAuthFieldNames,
  reservedBaseUploadFieldNames,
  reservedVerifyFieldNames,
} from './reservedFieldNames.js'
import { sanitizeJoinField } from './sanitizeJoinField.js'
import { fieldAffectsData as _fieldAffectsData, fieldIsLocalized, tabHasName } from './types.js'

type SanitizeFieldsArgs = {
  collectionConfig?: CollectionConfig
  config: Config
  existingFieldNames?: Set<string>
  fields: Field[]
  globalConfig?: GlobalConfig
  /**
   * Used to prevent unnecessary sanitization of fields that are not top-level.
   */
  isTopLevelField?: boolean
  joinPath?: string
  /**
   * When not passed in, assume that join are not supported (globals, arrays, blocks)
   */
  joins?: SanitizedJoins
  /**
   * Tracker for orderable join fields - populated during sanitization
   */
  orderableJoins?: OrderableJoinInfo[]
  /**
   * A string of '-' separated indexes representing where
   * to find this field in a given field schema array.
   */
  parentIndexPath?: string
  parentIsLocalized: boolean
  /**
   * Path for parent fields relative to their position in the schema.
   */
  parentSchemaPath?: string
  polymorphicJoins?: SanitizedJoin[]
  /**
   * If true, a richText field will require an editor property to be set, as the sanitizeFields function will not add it from the payload config if not present.
   *
   * @default false
   */
  requireFieldLevelRichTextEditor?: boolean
  /**
   * If this property is set, RichText fields won't be sanitized immediately. Instead, they will be added to this array as promises
   * so that you can sanitize them together, after the config has been sanitized.
   */
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>
  /**
   * If not null, will validate that upload and relationship fields do not relate to a collection that is not in this array.
   * This validation will be skipped if validRelationships is null.
   */
  validRelationships: null | string[]
}

export type SanitizeFieldArgs = {
  collectionConfig?: CollectionConfig
  config: Config
  existingFieldNames: Set<string>
  field: Field
  globalConfig?: GlobalConfig
  /**
   * The index of this field in the parent fields array
   */
  index: number
  /**
   * Used to prevent unnecessary sanitization of fields that are not top-level.
   */
  isTopLevelField: boolean
  joinPath: string
  /**
   * When not passed in, assume that joins are not supported (globals, arrays, blocks)
   */
  joins?: SanitizedJoins
  /**
   * Tracker for orderable join fields - populated during sanitization
   */
  orderableJoins?: OrderableJoinInfo[]
  parentIndexPath: string
  parentIsLocalized: boolean
  parentSchemaPath: string
  polymorphicJoins?: SanitizedJoin[]
  requireFieldLevelRichTextEditor: boolean
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>
  validRelationships: null | string[]
}

type SanitizeFieldResult = {
  /**
   * Fields to insert after this field (e.g., timezone field)
   */
  fieldsToInsert?: Field[]
}

/**
 * Sanitize a single field. Handles all per-field logic including:
 * - Validation setup
 * - Hooks/access/admin defaults
 * - Type-specific handling
 * - Recursive sanitization of nested fields
 *
 * @returns Result containing any fields to insert after this one
 */
export const sanitizeField = async ({
  collectionConfig,
  config,
  existingFieldNames,
  field,
  globalConfig,
  index,
  isTopLevelField,
  joinPath,
  joins,
  orderableJoins,
  parentIndexPath,
  parentIsLocalized,
  parentSchemaPath,
  polymorphicJoins,
  requireFieldLevelRichTextEditor,
  richTextSanitizationPromises,
  validRelationships,
}: SanitizeFieldArgs): Promise<SanitizeFieldResult> => {
  const result: SanitizeFieldResult = {}

  if ('_sanitized' in field && field._sanitized === true) {
    return result
  }

  if ('_sanitized' in field) {
    field._sanitized = true
  }

  if (!field.type) {
    throw new MissingFieldType(field)
  }

  const fieldAffectsData = _fieldAffectsData(field)

  const { indexPath, schemaPath } = getFieldPaths({
    field,
    index,
    parentIndexPath,
    parentSchemaPath,
  })

  // Reserved field name checks
  if (isTopLevelField && fieldAffectsData && field.name) {
    if (collectionConfig && collectionConfig.upload) {
      if (reservedBaseUploadFieldNames.includes(field.name)) {
        throw new ReservedFieldName(field, field.name)
      }
    }

    if (
      collectionConfig &&
      collectionConfig.auth &&
      typeof collectionConfig.auth === 'object' &&
      !collectionConfig.auth.disableLocalStrategy
    ) {
      if (reservedBaseAuthFieldNames.includes(field.name)) {
        throw new ReservedFieldName(field, field.name)
      }

      if (collectionConfig.auth.verify) {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        if (reservedAPIKeyFieldNames.includes(field.name)) {
          throw new ReservedFieldName(field, field.name)
        }

        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        if (reservedVerifyFieldNames.includes(field.name)) {
          throw new ReservedFieldName(field, field.name)
        }
      }
    }
  }

  // Invalid field name check
  if (fieldAffectsData && field.name.includes('.')) {
    throw new InvalidFieldName(field, field.name)
  }

  // Auto-label
  if (
    'name' in field &&
    field.name &&
    typeof field.label !== 'object' &&
    typeof field.label !== 'string' &&
    typeof field.label !== 'function' &&
    field.label !== false
  ) {
    field.label = toWords(field.name)
  }

  // Checkbox default
  if (
    field.type === 'checkbox' &&
    typeof field.defaultValue === 'undefined' &&
    field.required === true
  ) {
    field.defaultValue = false
  }

  // Join field sanitization
  if (field.type === 'join') {
    sanitizeJoinField({
      config,
      field,
      joinPath,
      joins,
      orderableJoins,
      parentIsLocalized,
      polymorphicJoins,
    })
  }

  // Relationship/upload validation
  if (field.type === 'relationship' || field.type === 'upload') {
    if (Array.isArray(field.relationTo) && field.relationTo.length === 0) {
      throw new Error(
        `Field "${field.name}" of type "${field.type}" has an empty relationTo array. At least one collection must be specified.`,
      )
    }

    if (validRelationships) {
      const relationships = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]

      relationships.forEach((relationship: string) => {
        if (!validRelationships.includes(relationship)) {
          throw new InvalidFieldRelationship(field, relationship)
        }
      })
    }

    if (field.min && !field.minRows) {
      console.warn(
        `(payload): The "min" property is deprecated for the Relationship field "${field.name}" and will be removed in a future version. Please use "minRows" instead.`,
      )
      field.minRows = field.min
    }

    if (field.max && !field.maxRows) {
      console.warn(
        `(payload): The "max" property is deprecated for the Relationship field "${field.name}" and will be removed in a future version. Please use "maxRows" instead.`,
      )
      field.maxRows = field.max
    }
  }

  // Upload isSortable default
  if (field.type === 'upload') {
    if (!field.admin || !('isSortable' in field.admin)) {
      field.admin = {
        isSortable: true,
        ...field.admin,
      }
    }
  }

  // Array ID field
  if (field.type === 'array' && field.fields) {
    const hasCustomID = field.fields.some((f) => 'name' in f && f.name === 'id')
    if (!hasCustomID) {
      field.fields.push(baseIDField)
    }
  }

  // Blocks/array labels
  if ((field.type === 'blocks' || field.type === 'array') && field.label) {
    field.labels = field.labels || formatLabels(field.name)
  }

  if (fieldAffectsData) {
    if (existingFieldNames.has(field.name)) {
      throw new DuplicateFieldName(field.name)
    } else if (!['blockName', 'id'].includes(field.name)) {
      existingFieldNames.add(field.name)
    }

    if (typeof field.localized !== 'undefined') {
      let shouldDisableLocalized = !config.localization

      if (
        process.env.NEXT_PUBLIC_PAYLOAD_COMPATIBILITY_allowLocalizedWithinLocalized !== 'true' &&
        parentIsLocalized &&
        // @todo PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY=true will be the default in 4.0
        process.env.PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY !== 'true'
      ) {
        shouldDisableLocalized = true
      }

      if (shouldDisableLocalized) {
        delete field.localized
      }
    }

    if (typeof field.validate === 'undefined') {
      if ('virtual' in field && field.virtual) {
        field.validate = (): true => true
      } else {
        const defaultValidate = validations[field.type as keyof typeof validations]
        if (defaultValidate) {
          field.validate = (val: any, options: any) =>
            defaultValidate(val, { ...field, ...options })
        } else {
          field.validate = (): true => true
        }
      }
    }

    if (!field.hooks) {
      field.hooks = {}
    }

    if (!field.access) {
      field.access = {}
    }

    setDefaultBeforeDuplicate(field, parentIsLocalized)
  }

  if (!field.admin) {
    field.admin = {}
  }

  if ('virtual' in field && field.virtual && field.admin.readOnly !== false && fieldAffectsData) {
    field.admin.readOnly = true
  }

  // Make sure that the richText field has an editor
  if (field.type === 'richText') {
    const sanitizeRichText = async (_config: SanitizedConfig) => {
      if (!field.editor) {
        if (_config.editor && !requireFieldLevelRichTextEditor) {
          // config.editor should be sanitized at this point
          field.editor = _config.editor
        } else {
          throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
        }
      }

      if (typeof field.editor === 'function') {
        field.editor = await field.editor({
          config: _config,
          isRoot: requireFieldLevelRichTextEditor,
          parentIsLocalized: (parentIsLocalized || field.localized)!,
        })
      }

      if (field.editor.i18n && Object.keys(field.editor.i18n).length >= 0) {
        config.i18n!.translations = deepMergeSimple(config.i18n!.translations!, field.editor.i18n)
      }
    }
    if (richTextSanitizationPromises) {
      richTextSanitizationPromises.push(sanitizeRichText)
    } else {
      await sanitizeRichText(config as unknown as SanitizedConfig)
    }
  }

  if (field.type === 'blocks' && field.blocks) {
    if (field.blockReferences && field.blocks?.length) {
      throw new Error('You cannot have both blockReferences and blocks in the same blocks field')
    }

    const blockSlugs: string[] = []

    for (const block of field.blockReferences ?? field.blocks) {
      const blockSlug = typeof block === 'string' ? block : block.slug

      if (blockSlugs.includes(blockSlug)) {
        throw new DuplicateFieldName(blockSlug)
      }

      blockSlugs.push(blockSlug)

      if (typeof block === 'string') {
        continue
      }

      if (block._sanitized === true) {
        continue
      }

      block._sanitized = true
      block.fields = block.fields.concat(baseBlockFields)
      block.labels = !block.labels ? formatLabels(block.slug) : block.labels

      block.fields = await sanitizeFields({
        collectionConfig,
        config,
        existingFieldNames: new Set(),
        fields: block.fields,
        isTopLevelField: false,
        parentIndexPath: '',
        parentIsLocalized: (parentIsLocalized || field.localized)!,
        parentSchemaPath: schemaPath + '.' + block.slug,
        requireFieldLevelRichTextEditor,
        richTextSanitizationPromises,
        validRelationships,
      })
    }
  }

  if ('fields' in field && field.fields) {
    field.fields = await sanitizeFields({
      collectionConfig,
      config,
      existingFieldNames: fieldAffectsData ? new Set() : existingFieldNames,
      fields: field.fields,
      isTopLevelField: isTopLevelField && !fieldAffectsData,
      joinPath: fieldAffectsData ? `${joinPath ? joinPath + '.' : ''}${field.name}` : joinPath,
      joins,
      orderableJoins,
      parentIndexPath: fieldAffectsData ? '' : indexPath,
      parentIsLocalized: parentIsLocalized || fieldIsLocalized(field),
      parentSchemaPath: schemaPath,
      polymorphicJoins,
      requireFieldLevelRichTextEditor,
      richTextSanitizationPromises,
      validRelationships,
    })
  }

  if (field.type === 'tabs') {
    for (let j = 0; j < field.tabs.length; j++) {
      const tab = field.tabs[j]!

      const isNamedTab = tabHasName(tab)

      if (isNamedTab && typeof tab.label === 'undefined') {
        tab.label = toWords(tab.name)
      }

      const { indexPath: tabIndexPath, schemaPath: tabSchemaPath } = getFieldPaths({
        field: tab,
        index: j,
        parentIndexPath: indexPath,
        parentSchemaPath: schemaPath,
      })

      if (
        'admin' in tab &&
        tab.admin?.condition &&
        typeof tab.admin.condition === 'function' &&
        !tab.id
      ) {
        tab.id = tabSchemaPath
      }

      tab.fields = await sanitizeFields({
        collectionConfig,
        config,
        existingFieldNames: isNamedTab ? new Set() : existingFieldNames,
        fields: tab.fields,
        isTopLevelField: isTopLevelField && !isNamedTab,
        joinPath: isNamedTab ? `${joinPath ? joinPath + '.' : ''}${tab.name}` : joinPath,
        joins,
        orderableJoins,
        parentIndexPath: isNamedTab ? '' : tabIndexPath,
        parentIsLocalized: parentIsLocalized || (isNamedTab && tab.localized)!,
        parentSchemaPath: tabSchemaPath,
        polymorphicJoins,
        requireFieldLevelRichTextEditor,
        richTextSanitizationPromises,
        validRelationships,
      })

      field.tabs[j] = tab
    }
  }

  if (field.type === 'ui' && typeof field.admin.disableBulkEdit === 'undefined') {
    field.admin.disableBulkEdit = true
  }

  // Timezone field insertion
  if (field.type === 'date' && field.timezone) {
    const name = field.name + '_tz'

    let defaultTimezone =
      field.timezone && typeof field.timezone === 'object'
        ? field.timezone.defaultTimezone
        : config.admin?.timezones?.defaultTimezone

    const required =
      field.required ||
      (field.timezone && typeof field.timezone === 'object' && field.timezone.required)

    const supportedTimezones =
      field.timezone && typeof field.timezone === 'object' && field.timezone.supportedTimezones
        ? field.timezone.supportedTimezones
        : config.admin?.timezones?.supportedTimezones

    const options =
      typeof supportedTimezones === 'function'
        ? supportedTimezones({ defaultTimezones })
        : supportedTimezones

    validateTimezones({
      source: `field "${field.name}" timezone.supportedTimezones`,
      timezones: options,
    })

    if (options && options.length === 1 && options[0]?.value) {
      defaultTimezone = options[0].value
    }

    // Generate label for timezone field
    const timezoneLabel = typeof field.label === 'string' ? `${field.label} Tz` : toWords(name)

    const baseField = baseTimezoneField({
      name,
      defaultValue: defaultTimezone,
      label: timezoneLabel,
      options,
      required,
    })

    // Apply override if provided
    const timezoneField =
      typeof field.timezone === 'object' && typeof field.timezone.override === 'function'
        ? field.timezone.override({ baseField })
        : baseField

    result.fieldsToInsert = [timezoneField]
  }

  // Virtual field handling
  if ('virtual' in field && typeof field.virtual === 'string') {
    const virtualField = field
    const configFields = (collectionConfig || globalConfig)?.fields
    if (configFields) {
      let flattenFields = flattenAllFields({ fields: configFields })
      const paths = field.virtual.split('.')
      let isHasMany = false

      for (const [idx, segment] of paths.entries()) {
        const foundField = flattenFields.find((e) => e.name === segment)
        if (!foundField) {
          break
        }

        if (
          foundField.type === 'group' ||
          foundField.type === 'tab' ||
          foundField.type === 'array'
        ) {
          flattenFields = foundField.flattenedFields
        } else if (
          (foundField.type === 'relationship' || foundField.type === 'upload') &&
          idx !== paths.length - 1 &&
          typeof foundField.relationTo === 'string'
        ) {
          if (
            foundField.hasMany &&
            (virtualField.type === 'text' ||
              virtualField.type === 'number' ||
              virtualField.type === 'select')
          ) {
            if (isHasMany) {
              throw new InvalidConfiguration(
                `Virtual field ${virtualField.name} in ${globalConfig ? `global ${globalConfig.slug}` : `collection ${collectionConfig?.slug}`} references 2 or more hasMany relationships on the path ${virtualField.virtual} which is not allowed.`,
              )
            }

            isHasMany = true
            virtualField.hasMany = true
          }
          const relatedCollection = config.collections?.find(
            (e) => e.slug === foundField.relationTo,
          )
          if (relatedCollection) {
            flattenFields = flattenAllFields({ fields: relatedCollection.fields })
          }
        }
      }
    }
  }

  return result
}

export const sanitizeFields = async ({
  collectionConfig,
  config,
  existingFieldNames = new Set(),
  fields,
  globalConfig,
  isTopLevelField = true,
  joinPath = '',
  joins,
  orderableJoins,
  parentIndexPath = '',
  parentIsLocalized,
  parentSchemaPath = '',
  polymorphicJoins,
  requireFieldLevelRichTextEditor = false,
  richTextSanitizationPromises,
  validRelationships,
}: SanitizeFieldsArgs): Promise<Field[]> => {
  if (!fields) {
    return []
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]!

    const result = await sanitizeField({
      collectionConfig,
      config,
      existingFieldNames,
      field,
      globalConfig,
      index: i,
      isTopLevelField,
      joinPath,
      joins,
      orderableJoins,
      parentIndexPath,
      parentIsLocalized,
      parentSchemaPath,
      polymorphicJoins,
      requireFieldLevelRichTextEditor,
      richTextSanitizationPromises,
      validRelationships,
    })

    fields[i] = field

    if (result.fieldsToInsert?.length) {
      fields.splice(i + 1, 0, ...result.fieldsToInsert)
      i += result.fieldsToInsert.length
    }
  }

  return fields
}
