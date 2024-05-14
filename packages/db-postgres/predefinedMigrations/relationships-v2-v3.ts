import type { SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'
import { Payload } from 'payload/dist'
import { Collection } from 'payload/dist/collections/config/types'
import { Field, TabAsField, } from 'payload/dist/fields/config/types'
import { buildVersionCollectionFields } from 'payload/dist/versions/buildCollectionFields'
import toSnakeCase from 'to-snake-case'

const collectionRelationshipMap: Record<string, {
  // ex: category_id
  columnName: string
  // group_
  columnPrefix: string
  idType: 'number' | 'serial' | 'text' | 'uuid'
  localized: boolean
  // ex: posts_rels, _posts_v_rels
  tableName: string
  // ex: posts, _posts_v, posts_blocks_relationships, posts_array_relationships
  targetTableName: string
}[]> = {}
const findRelationships = (
  {
    collection,
    columnPrefix,
    fields,
    localized,
    payload,
    tableName,
    version,
  }: {
    collection: Collection,
    columnPrefix: string,
    fields: Field[] | TabAsField,
    localized?: boolean,
    payload: Payload,
    tableName: string,
    version?: boolean,
  }
) => {
  const { db } = payload
  const rootTableName = db.tableNameMap.get(version ? `_${toSnakeCase(collection.slug)}${db.versionsSuffix}` : toSnakeCase(collection.slug))

  let newTableName = tableName
  collectionRelationshipMap[newTableName] = collectionRelationshipMap[newTableName] || []

  return fields.forEach((field) => {
    if (!(typeof 'type' in field) || !field.type) {
      return
    }

    if ((field.type === 'relationship' || field.type === 'upload') && !field.hasMany && typeof field.relationTo === 'string') {
      if (field.localized) {
        localized = true
      }
      collectionRelationshipMap[newTableName].push({
        columnName: `${toSnakeCase(field.relationTo)}_id`,
        columnPrefix,
        idType: collection.customIDType || db.idType,
        localized: field.localized,
        tableName: `${db.tableNameMap.get(rootTableName)}${db.relationshipsSuffix}`,
        targetTableName: `${db.tableNameMap.get(newTableName)}${localized ? db.localesSuffix : ''}`,
      })
      return
    }

    if (field.type === 'blocks') {
      field.blocks.forEach((blockType) => {
        const block = field.blocks.find((block) => block.slug === blockType)
        fields = block.fields
        newTableName = db.tableNameMap.get(
          `${tableName}_blocks_${toSnakeCase(block.slug)}`,
        )
        findRelationships({
          collection,
          columnPrefix,
          fields,
          payload,
          tableName: newTableName,
          version,
        })
      })
      return
    }
    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        fields = tab.fields
        if (tab.name) {
          columnPrefix += `${toSnakeCase(tab.name)}_`
        }
        findRelationships({
          collection,
          columnPrefix,
          fields,
          localized: tab.localized,
          payload,
          tableName: newTableName,
          version,
        })
      })
      return
    }

    let fields = field.fields
    let isLocalized

    switch (field.type) {
      case 'group':
        if (field.localized) {
          isLocalized = true
        }
        if (field.name) {
          columnPrefix += `${toSnakeCase(field.name)}_`
        }
        break
      case 'array':
        newTableName = db.tableNameMap.get(`${tableName}_${toSnakeCase(field.name)}`)
        break
    }
    if (fields) {
      findRelationships({
        collection,
        columnPrefix,
        fields,
        localized: isLocalized,
        payload,
        tableName: newTableName,
        version,
      })
    }
  })
}

const up = async function up(payload) {
  // TODO: Early return to skip migration if the version of drizzle is above 5

  // For each collection and global get the fields and find the relationships that need migration
  // find all the relationships that need to be updated
  // creating a path object to key the relationships by the path
  const columnPrefix = ''
    payload.collections.forEach((collection) => {
      const tableName = toSnakeCase(collection.slug)
      findRelationships({ collection, columnPrefix, fields: collection.fields, payload, tableName })
      if (collection.versions) {
        const versionFields = buildVersionCollectionFields(collection)
        findRelationships({
          collection,
          columnPrefix,
          fields: versionFields,
          payload,
          tableName,
          version: true,
        })
      }
    })
  payload.globals.forEach((global) => {
    findRelationships({ collection: global, columnPrefix, fields: global.fields, payload, tableName: toSnakeCase(global.slug)})
    if (global.versions) {
      const versionFields = buildVersionCollectionFields(global)
      findRelationships({ collection: global, columnPrefix, fields: versionFields, payload, tableName: toSnakeCase(global), version: true})
    }
  })

  let createColumnsSQL = ''

  // update schema to hold new relationship columns in the format of the destination
  // - do not enforce referential integrity while populating the new columns
  Object.entries(collectionRelationshipMap).forEach(([slug, relationships]) => {
    relationships.forEach(({ columnName, idType, targetTableName }) => {
      let idColumnType = 'integer'
      switch (idType) {
        case 'number':
          idColumnType = 'numeric'
          break
        case 'text':
          idColumnType = 'varchar'
          break
        case 'uuid':
          idColumnType = 'uuid'
          break
        case 'serial':
          idColumnType = 'integer'
          break
        default:
          break
      }
      createColumnsSQL += `ALTER TABLE "${targetTableName}" ADD COLUMN "${columnName}" ${idColumnType};`
    })
  })

  await payload.db.drizzle.execute(sql`${createColumnsSQL}`);

  /**
   * This needs to return a query that gets the ids of the tables to update with the new relationship columns
   * @param locale
   * @param parent_id
   * @param path
   * @param targetTableName
   */
  const queryPath = ({locale, parent_id, path, targetTableName }): SQL => {
    // the relationship is directly on the collection table
    if (!path.includes('.')) {
      if (!locale) {
        return sql`select "id" from "${targetTableName}" where "id" = ${parent_id}`
      }
      return sql`select "id" from "${targetTableName}" where "id" = ${parent_id} and "_locale" = ${locale}`
      // the relationship is on the locales table
    }

    // TODO: map path to arrays and blocks that will be joined in and return the id for the row that needs to be written to
    // const pathParts = path.split('.')

  }

  // for each relationship that was found, copy the relationship to the new columns
  Object.entries(collectionRelationshipMap).forEach(async ([slug, relationships]) => {

    relationships.forEach(async ({columnName, localized, tableName, targetTableName}) => {
      // for blocks and arrays we need to join all the tables with orderBy "order", then get the id from the index returned
      const selectStatement = sql`select "parent_id", "path", ${localized ? `"locale",` : ''} ${columnName} as value from ${tableName}`
      const result = await payload.db.drizzle.query(selectStatement)

      result.forEach(async ({ locale, parent_id, path, value }) => {
        // if a path has a dot parse it
        const selectTargetSQL = queryPath({locale,parent_id, path, targetTableName, })

        const targetResult = await payload.db.drizzle.query(selectTargetSQL)
        // update the new columns with the existing data
        const updateSQL = sql`update ${targetTableName} set ${`${columnPrefix}${columnName}`} = ${value} where "id" = ${targetResult.id}`
        await payload.db.drizzle.execute(updateSQL)
      })
    })
  })
  // drop the old columns and possibly entire tables (_rels)

  // add foreign key constraints to the new columns
  // if this errors, they have bad data


}

// module.exports.up = ``
