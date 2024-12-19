import type { Field, FieldAffectingData, FlattenedField, SelectMode, SelectType } from 'payload'

import { deepCopyObjectSimple, fieldAffectsData, getSelectMode } from 'payload/shared'

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

const blockTypeField: Field = {
  name: 'blockType',
  type: 'text',
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
  fields: FlattenedField[]
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
      case 'array':
      case 'group':
      case 'tab': {
        const fieldSelect = select[field.name] as SelectType

        if (field.type === 'array' && selectMode === 'include') {
          fieldSelect['id'] = true
        }

        traverseFields({
          adapter,
          databaseSchemaPath: fieldDatabaseSchemaPath,
          fields: field.flattenedFields,
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
            addFieldToProjection({
              adapter,
              databaseSchemaPath: fieldDatabaseSchemaPath,
              field: blockTypeField,
              projection,
              withinLocalizedField: fieldWithinLocalizedField,
            })

            traverseFields({
              adapter,
              databaseSchemaPath: fieldDatabaseSchemaPath,
              fields: block.flattenedFields,
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
            addFieldToProjection({
              adapter,
              databaseSchemaPath: fieldDatabaseSchemaPath,
              field: blockTypeField,
              projection,
              withinLocalizedField: fieldWithinLocalizedField,
            })
          }

          traverseFields({
            adapter,
            databaseSchemaPath: fieldDatabaseSchemaPath,
            fields: block.flattenedFields,
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
  fields: FlattenedField[]
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
