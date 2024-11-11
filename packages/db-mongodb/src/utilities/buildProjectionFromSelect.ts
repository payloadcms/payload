import {
  deepCopyObjectSimple,
  type Field,
  type FieldAffectingData,
  type SelectMode,
  type SelectType,
  type TabAsField,
} from 'payload'
import { fieldAffectsData, getSelectMode, tabHasName } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

const addFieldToProjection = ({
  adapter,
  databaseSchemaPath,
  field,
  projection,
  withinLocalizedField,
}: {
  adapter: MongooseAdapter
  databaseSchemaPath: string
  field: FieldAffectingData
  projection: Record<string, true>
  withinLocalizedField: boolean
}) => {
  const { config } = adapter.payload

  if (withinLocalizedField && config.localization) {
    for (const locale of config.localization.localeCodes) {
      const localeDatabaseSchemaPath = databaseSchemaPath.replace('<locale>', locale)
      projection[`${localeDatabaseSchemaPath}${field.name}`] = true
    }
  } else {
    projection[`${databaseSchemaPath}${field.name}`] = true
  }
}

const traverseFields = ({
  adapter,
  databaseSchemaPath = '',
  fields,
  projection,
  select,
  selectAllOnCurrentLevel = false,
  selectMode,
  withinLocalizedField = false,
}: {
  adapter: MongooseAdapter
  databaseSchemaPath?: string
  fields: (Field | TabAsField)[]
  projection: Record<string, true>
  select: SelectType
  selectAllOnCurrentLevel?: boolean
  selectMode: SelectMode
  withinLocalizedField?: boolean
}) => {
  for (const field of fields) {
    if (fieldAffectsData(field)) {
      if (selectMode === 'include') {
        if (select[field.name] === true || selectAllOnCurrentLevel) {
          addFieldToProjection({
            adapter,
            databaseSchemaPath,
            field,
            projection,
            withinLocalizedField,
          })
          continue
        }

        if (!select[field.name]) {
          continue
        }
      }

      if (selectMode === 'exclude') {
        if (typeof select[field.name] === 'undefined') {
          addFieldToProjection({
            adapter,
            databaseSchemaPath,
            field,
            projection,
            withinLocalizedField,
          })
          continue
        }

        if (select[field.name] === false) {
          continue
        }
      }
    }

    let fieldDatabaseSchemaPath = databaseSchemaPath
    let fieldWithinLocalizedField = withinLocalizedField

    if (fieldAffectsData(field)) {
      fieldDatabaseSchemaPath = `${databaseSchemaPath}${field.name}.`

      if (field.localized) {
        fieldDatabaseSchemaPath = `${fieldDatabaseSchemaPath}<locale>.`
        fieldWithinLocalizedField = true
      }
    }

    switch (field.type) {
      case 'collapsible':
      case 'row':
        traverseFields({
          adapter,
          databaseSchemaPath,
          fields: field.fields,
          projection,
          select,
          selectMode,
          withinLocalizedField,
        })
        break

      case 'tabs':
        traverseFields({
          adapter,
          databaseSchemaPath,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          projection,
          select,
          selectMode,
          withinLocalizedField,
        })
        break

      case 'group':
      case 'tab':
      case 'array': {
        let fieldSelect: SelectType

        if (field.type === 'tab' && !tabHasName(field)) {
          fieldSelect = select
        } else {
          fieldSelect = select[field.name] as SelectType
        }

        if (field.type === 'array' && selectMode === 'include') {
          fieldSelect['id'] = true
        }

        traverseFields({
          adapter,
          databaseSchemaPath: fieldDatabaseSchemaPath,
          fields: field.fields,
          projection,
          select: fieldSelect,
          selectMode,
          withinLocalizedField: fieldWithinLocalizedField,
        })

        break
      }

      case 'blocks': {
        const blocksSelect = select[field.name] as SelectType

        for (const block of field.blocks) {
          if (
            (selectMode === 'include' && blocksSelect[block.slug] === true) ||
            (selectMode === 'exclude' && typeof blocksSelect[block.slug] === 'undefined')
          ) {
            traverseFields({
              adapter,
              databaseSchemaPath: fieldDatabaseSchemaPath,
              fields: block.fields,
              projection,
              select: {},
              selectAllOnCurrentLevel: true,
              selectMode: 'include',
              withinLocalizedField: fieldWithinLocalizedField,
            })
            continue
          }

          let blockSelectMode = selectMode

          if (selectMode === 'exclude' && blocksSelect[block.slug] === false) {
            blockSelectMode = 'include'
          }

          if (typeof blocksSelect[block.slug] !== 'object') {
            blocksSelect[block.slug] = {}
          }

          if (blockSelectMode === 'include') {
            blocksSelect[block.slug]['id'] = true
            blocksSelect[block.slug]['blockType'] = true
          }

          traverseFields({
            adapter,
            databaseSchemaPath: fieldDatabaseSchemaPath,
            fields: block.fields,
            projection,
            select: blocksSelect[block.slug] as SelectType,
            selectMode: blockSelectMode,
            withinLocalizedField: fieldWithinLocalizedField,
          })
        }

        break
      }

      default:
        break
    }
  }
}

export const buildProjectionFromSelect = ({
  adapter,
  fields,
  select,
}: {
  adapter: MongooseAdapter
  fields: Field[]
  select?: SelectType
}): Record<string, true> | undefined => {
  if (!select) {
    return
  }

  const projection: Record<string, true> = {
    _id: true,
  }

  traverseFields({
    adapter,
    fields,
    projection,
    // Clone to safely mutate it later
    select: deepCopyObjectSimple(select),
    selectMode: getSelectMode(select),
  })

  return projection
}
