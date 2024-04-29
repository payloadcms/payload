import type { Config } from '../../config/types.js'
import type { Field } from './types.js'

import { MissingEditorProp } from '../../errors/MissingEditorProp.js'
import {
  DuplicateFieldName,
  InvalidFieldName,
  InvalidFieldRelationship,
  MissingFieldType,
} from '../../errors/index.js'
import { formatLabels, toWords } from '../../utilities/formatLabels.js'
import { baseBlockFields } from '../baseFields/baseBlockFields.js'
import { baseIDField } from '../baseFields/baseIDField.js'
import { setDefaultBeforeDuplicate } from '../setDefaultBeforeDuplicate.js'
import validations from '../validations.js'
import { fieldAffectsData, tabHasName } from './types.js'

type Args = {
  config: Config
  existingFieldNames?: Set<string>
  fields: Field[]
  /**
   * If true, a richText field will require an editor property to be set, as the sanitizeFields function will not add it from the payload config if not present.
   *
   * @default false
   */
  requireFieldLevelRichTextEditor?: boolean
  /**
   * If not null, will validate that upload and relationship fields do not relate to a collection that is not in this array.
   * This validation will be skipped if validRelationships is null.
   */
  validRelationships: null | string[]
}

export const sanitizeFields = async ({
  config,
  existingFieldNames = new Set(),
  fields,
  requireFieldLevelRichTextEditor = false,
  validRelationships,
}: Args): Promise<Field[]> => {
  if (!fields) return []

  for (const field of fields) {
    if (!field.type) throw new MissingFieldType(field)

    // assert that field names do not contain forbidden characters
    if (fieldAffectsData(field) && field.name.includes('.')) {
      throw new InvalidFieldName(field, field.name)
    }

    // Auto-label
    if (
      'name' in field &&
      field.name &&
      typeof field.label !== 'object' &&
      typeof field.label !== 'string' &&
      field.label !== false
    ) {
      field.label = toWords(field.name)
    }

    if (
      field.type === 'checkbox' &&
      typeof field.defaultValue === 'undefined' &&
      field.required === true
    ) {
      field.defaultValue = false
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      if (validRelationships) {
        const relationships = Array.isArray(field.relationTo)
          ? field.relationTo
          : [field.relationTo]
        relationships.forEach((relationship: string) => {
          if (!validRelationships.includes(relationship)) {
            throw new InvalidFieldRelationship(field, relationship)
          }
        })
      }

      if (field.type === 'relationship') {
        if (field.min && !field.minRows) {
          console.warn(
            `(payload): The "min" property is deprecated for the Relationship field "${field.name}" and will be removed in a future version. Please use "minRows" instead.`,
          )
        }
        if (field.max && !field.maxRows) {
          console.warn(
            `(payload): The "max" property is deprecated for the Relationship field "${field.name}" and will be removed in a future version. Please use "maxRows" instead.`,
          )
        }
        field.minRows = field.minRows || field.min
        field.maxRows = field.maxRows || field.max
      }
    }

    if (field.type === 'blocks' && field.blocks) {
      field.blocks = field.blocks.map((block) => ({
        ...block,
        fields: block.fields.concat(baseBlockFields),
      }))
    }

    if (field.type === 'array' && field.fields) {
      field.fields.push(baseIDField)
    }

    if ((field.type === 'blocks' || field.type === 'array') && field.label) {
      field.labels = field.labels || formatLabels(field.name)
    }

    if (fieldAffectsData(field)) {
      if (existingFieldNames.has(field.name)) {
        throw new DuplicateFieldName(field.name)
      } else if (!['blockName', 'id'].includes(field.name)) {
        existingFieldNames.add(field.name)
      }

      if (field.localized && !config.localization) delete field.localized

      if (typeof field.validate === 'undefined') {
        const defaultValidate = validations[field.type]
        if (defaultValidate) {
          field.validate = (val, options) => defaultValidate(val, { ...field, ...options })
        } else {
          field.validate = () => true
        }
      }

      if (!field.hooks) field.hooks = {}
      if (!field.access) field.access = {}

      setDefaultBeforeDuplicate(field)
    }

    if (!field.admin) {
      field.admin = {}
    }

    // Make sure that the richText field has an editor
    if (field.type === 'richText') {
      if (!field.editor) {
        if (config.editor && !requireFieldLevelRichTextEditor) {
          // config.editor should be sanitized at this point
          field.editor = config.editor
        } else {
          throw new MissingEditorProp(field)
        }
      }

      if (typeof field.editor === 'function') {
        field.editor = await field.editor({ config })
      }

      // Add editor adapter hooks to field hooks
      if (!field.hooks) field.hooks = {}

      if (field?.editor?.hooks?.afterRead?.length) {
        field.hooks.afterRead = field.hooks.afterRead
          ? field.hooks.afterRead.concat(field.editor.hooks.afterRead)
          : field.editor.hooks.afterRead
      }
      if (field?.editor?.hooks?.beforeChange?.length) {
        field.hooks.beforeChange = field.hooks.beforeChange
          ? field.hooks.beforeChange.concat(field.editor.hooks.beforeChange)
          : field.editor.hooks.beforeChange
      }
      if (field?.editor?.hooks?.beforeValidate?.length) {
        field.hooks.beforeValidate = field.hooks.beforeValidate
          ? field.hooks.beforeValidate.concat(field.editor.hooks.beforeValidate)
          : field.editor.hooks.beforeValidate
      }
      if (field?.editor?.hooks?.beforeChange?.length) {
        field.hooks.beforeChange = field.hooks.beforeChange
          ? field.hooks.beforeChange.concat(field.editor.hooks.beforeChange)
          : field.editor.hooks.beforeChange
      }
    }

    if ('fields' in field && field.fields) {
      field.fields = await sanitizeFields({
        config,
        existingFieldNames: fieldAffectsData(field) ? new Set() : existingFieldNames,
        fields: field.fields,
        requireFieldLevelRichTextEditor,
        validRelationships,
      })
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (tabHasName(tab) && typeof tab.label === 'undefined') {
          tab.label = toWords(tab.name)
        }

        tab.fields = await sanitizeFields({
          config,
          existingFieldNames: tabHasName(tab) ? new Set() : existingFieldNames,
          fields: tab.fields,
          requireFieldLevelRichTextEditor,
          validRelationships,
        })
      }
    }

    if ('blocks' in field && field.blocks) {
      for (const block of field.blocks) {
        block.labels = !block.labels ? formatLabels(block.slug) : block.labels

        block.fields = await sanitizeFields({
          config,
          existingFieldNames: new Set(),
          fields: block.fields,
          requireFieldLevelRichTextEditor,
          validRelationships,
        })
      }
    }
  }

  return fields
}
