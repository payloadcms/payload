import type {
  FlattenedField,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { APIError, buildVersionCollectionFields } from 'payload'
import { fieldShouldBeLocalized } from 'payload/shared'
import * as ts from 'typescript'

import type { DrizzleAdapter, SetColumnID } from '../types.js'

import { buildRawSchema } from '../schema/buildRawSchema.js'

type BlockToMigrate = {
  data: Record<string, unknown>[]
  fieldAccessor: string[]
  locale?: string
}

type EntityToMigrate =
  | ({
      blocks: BlockToMigrate[]
    } & {
      id: number | string
      slug: string
      type: 'collection' | 'collectionVersion' | 'globalVersion'
    })
  | {
      slug: string
      type: 'global'
    }

const entityHasBlocksFieldToMigrate = (entity: { flattenedFields: FlattenedField[] }): boolean => {
  for (const field of entity.flattenedFields) {
    if (field.type === 'blocks') {
      return true
    }

    if (
      'flattenedFields' in field &&
      entityHasBlocksFieldToMigrate({ flattenedFields: field.flattenedFields })
    ) {
      return true
    }
  }

  return false
}

const collectBlocksToMigrate = ({
  config,
  data,
  fields,
  parentAccessor,
  parentIsLocalized,
}: {
  config: SanitizedConfig
  data: any
  fields: FlattenedField[]
  parentAccessor: string[]
  parentIsLocalized: boolean
}): BlockToMigrate[] => {
  const result: BlockToMigrate[] = []

  for (const field of fields) {
    if (field.type === 'blocks') {
      return
    }

    if (field.type === 'array') {
      const arrayData = data[field.name]

      if (!Array.isArray(arrayData)) {
        continue
      }

      if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
        result.push(
          ...collectBlocksToMigrate({
            config,
            data: arrayData,
            fields: config.localization.localeCodes.map((code) => ({
              ...field,
              name: code,
              localized: false,
            })),
            parentAccessor: [...parentAccessor, field.name],
            parentIsLocalized: true,
          }),
        )

        continue
      }

      for (const row of arrayData) {
        result.push(
          ...collectBlocksToMigrate({
            config,
            data: row,
            fields: field.flattenedFields,
            parentAccessor: [...parentAccessor, field.name],
            parentIsLocalized,
          }),
        )
      }
    }

    return result
  }

  export const createBlocksToJsonMigrator = (setColumnID: SetColumnID) =>
    async function BlocksToJsonMigrator(this: DrizzleAdapter) {
      if (this.blocksAsJSON) {
        throw new APIError('adapter.blocksAsJSON is set to true already.')
      }

      buildRawSchema({ adapter: this, setColumnID })
      const currentSchema = {
        foreignKeys: this.foreignKeys,
        indexes: this.indexes,
        rawTables: this.rawTables,
      }
      this.blocksAsJSON = true

      buildRawSchema({ adapter: this, setColumnID })

      const schemaWithBlocksAsJSON = {
        foreignKeys: this.foreignKeys,
        indexes: this.indexes,
        rawTables: this.rawTables,
      }

      const deletedTables = Object.keys(currentSchema.rawTables).filter(
        (each) => !(each in schemaWithBlocksAsJSON.rawTables),
      )

      const entities: EntityToMigrate[] = []

      for (const collection of this.payload.config.collections.filter(
        entityHasBlocksFieldToMigrate,
      )) {
        const data = await this.find({ collection: collection.slug, joins: false, limit: 0 })

        for (const doc of data.docs) {
          entities.push({
            id: doc.id,
            slug: collection.slug,
            type: 'collection',
            blocks: collectBlocksToMigrate({
              config: this.payload.config,
              data: doc,
              fields: collection.flattenedFields,
              parentAccessor: [],
            }),
          })

          // if (collection.versions) {
          //   const versions = await this.findVersions({
          //     collection: collection.slug,
          //     limit: 0,
          //     where: {
          //       parent: {
          //         equals: doc.id,
          //       },
          //     },
          //   })

          //   for (const version of versions.docs) {
          //     entities.push({
          //       id: version.id,
          //       slug: collection.slug,
          //       type: 'collectionVersion',
          //       blocks: collectBlocksToMigrate({
          //         config: this.payload.config,
          //         data: version,
          //         fields: buildVersionCollectionFields(this.payload.config, collection, true),
          //       }),
          //     })
          //   }
          // }
        }
      }

      const collectionsToMigrate = this.payload.config.collections.filter(
        entityHasBlocksFieldToMigrate,
      )
      const globalsToMigrate = this.payload.config.globals.filter(entityHasBlocksFieldToMigrate)

      const sqlStatements: string[] = []

      for (const tableName of deletedTables) {
        const rawTable = currentSchema.rawTables[tableName]
        if (!rawTable) {
          continue
        }
      }

      await Promise.resolve(1)
    }
}
