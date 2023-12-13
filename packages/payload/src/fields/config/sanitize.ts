import type { Config } from '../../config/types'
import type { Field } from './types'

import withCondition from '../../admin/components/forms/withCondition'
import {
  DuplicateFieldName,
  InvalidFieldName,
  InvalidFieldRelationship,
  MissingFieldType,
} from '../../errors'
import { deepMerge } from '../../utilities/deepMerge'
import { formatLabels, toWords } from '../../utilities/formatLabels'
import { baseBlockFields } from '../baseFields/baseBlockFields'
import { baseIDField } from '../baseFields/baseIDField'
import validations from '../validations'
import { fieldAffectsData, tabHasName } from './types'

type Args = {
  config: Config
  existingFieldNames?: Set<string>
  fields: Field[]
  /**
   * If not null, will validate that upload and relationship fields do not relate to a collection that is not in this array.
   * This validation will be skipped if validRelationships is null.
   */
  validRelationships: null | string[]
}

const addedRichTextI18ns = []

function isOnServer() {
  return !(typeof window != 'undefined' && window.document)
}

export const sanitizeFields = ({
  config,
  existingFieldNames = new Set(),
  fields,
  validRelationships,
}: Args): Field[] => {
  if (!fields) return []

  const isServer = isOnServer()

  return fields.map((unsanitizedField) => {
    const field: Field = { ...unsanitizedField }

    if (!field.type) throw new MissingFieldType(field)

    // assert that field names do not contain forbidden characters
    if (fieldAffectsData(field) && field.name.includes('.')) {
      throw new InvalidFieldName(field, field.name)
    }

    // Make sure that the richText field has an editor
    if (field.type === 'richText') {
      if (!field.editor && config.editor) {
        field.editor = config.editor
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { i18nServerToUse, serverEditor } = field?.editor?.i18nServer
        ? { i18nServerToUse: field?.editor?.i18nServer, serverEditor: field?.editor }
        : { i18nServerToUse: config?.editor?.i18nServer, serverEditor: config?.editor }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { clientEditor, i18nClientToUse } = field?.editor?.i18nClient
        ? { clientEditor: field?.editor, i18nClientToUse: field?.editor?.i18nClient }
        : { clientEditor: config?.editor, i18nClientToUse: config?.editor?.i18nClient }

      if (!config.i18n) {
        config.i18n = {}
      }
      if (!config.i18n.resources) {
        config.i18n.resources = {}
      }

      const stringifiedI18nServerToUse = JSON.stringify(i18nServerToUse)
      const stringifiedI18nClientToUse = JSON.stringify(i18nClientToUse)

      if (isServer && i18nServerToUse && !addedRichTextI18ns.includes(stringifiedI18nServerToUse)) {
        addedRichTextI18ns.push(stringifiedI18nServerToUse)
        config.i18n.resources = deepMerge(config.i18n.resources, i18nServerToUse)
      } else if (
        !isServer &&
        i18nClientToUse &&
        !addedRichTextI18ns.includes(stringifiedI18nClientToUse)
      ) {
        addedRichTextI18ns.push(stringifiedI18nClientToUse)
        config.i18n.resources = deepMerge(config.i18n.resources, i18nClientToUse)
      }
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
    }

    if (field.admin) {
      if (field.admin.condition && field.admin.components?.Field) {
        field.admin.components.Field = withCondition(field.admin.components?.Field)
      }
    } else {
      field.admin = {}
    }

    if ('fields' in field && field.fields) {
      field.fields = sanitizeFields({
        config,
        existingFieldNames: fieldAffectsData(field) ? new Set() : existingFieldNames,
        fields: field.fields,
        validRelationships,
      })
    }

    if (field.type === 'tabs') {
      field.tabs = field.tabs.map((tab) => {
        const unsanitizedTab = { ...tab }
        if (tabHasName(tab) && typeof tab.label === 'undefined') {
          unsanitizedTab.label = toWords(tab.name)
        }

        unsanitizedTab.fields = sanitizeFields({
          config,
          existingFieldNames: tabHasName(tab) ? new Set() : existingFieldNames,
          fields: tab.fields,
          validRelationships,
        })

        return unsanitizedTab
      })
    }

    if ('blocks' in field && field.blocks) {
      field.blocks = field.blocks.map((block) => {
        const unsanitizedBlock = { ...block }
        unsanitizedBlock.labels = !unsanitizedBlock.labels
          ? formatLabels(unsanitizedBlock.slug)
          : unsanitizedBlock.labels

        unsanitizedBlock.fields = sanitizeFields({
          config,
          existingFieldNames: new Set(),
          fields: block.fields,
          validRelationships,
        })

        return unsanitizedBlock
      })
    }

    return field
  })
}
