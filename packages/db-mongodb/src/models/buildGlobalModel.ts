import type { Field, TextField } from 'payload'

import mongoose from 'mongoose'
import { branchField } from 'payload'

import type { MongooseAdapter } from '../index.js'
import type { GlobalModel } from '../types.js'
import type { MongoSchemaBuildContext } from './schemaBuildContext.js'

import { getBuildQueryPlugin } from '../queries/getBuildQueryPlugin.js'
import { buildSchema } from './buildSchema.js'

export const buildGlobalModel = ({
  adapter,
  schemaBuildContext,
}: {
  adapter: MongooseAdapter
  schemaBuildContext: MongoSchemaBuildContext
}): GlobalModel | null => {
  if (adapter.payload.config.globals && adapter.payload.config.globals.length > 0) {
    const globalsSchema = new mongoose.Schema(
      {},
      { discriminatorKey: 'globalType', minimize: false, timestamps: true },
    )

    globalsSchema.plugin(getBuildQueryPlugin())

    if (adapter.payload.config.branching?.branchableGlobals.size) {
      globalsSchema.index(
        // eslint-disable-next-line perfectionist/sort-objects -- Keep the discriminator first for global-scoped queries.
        { globalType: 1, [branchField]: 1 },
        {
          partialFilterExpression: { [branchField]: { $exists: true } },
          unique: true,
        },
      )
    }

    const Globals = adapter.connection.model(
      'globals',
      globalsSchema,
      'globals',
    ) as unknown as GlobalModel

    Object.values(adapter.payload.config.globals).forEach((globalConfig) => {
      const isBranchableGlobal =
        adapter.payload.config.branching?.branchableGlobals.has(globalConfig.slug) ?? false
      const globalSchema = buildSchema({
        buildSchemaOptions: {
          options: {
            minimize: false,
          },
        },
        configFields: isBranchableGlobal
          ? removeBranchFieldIndex({ fields: globalConfig.fields })
          : globalConfig.fields,
        payload: adapter.payload,
        schemaBuildContext,
        schemaPath: `global:${globalConfig.slug}`,
      })
      Globals.discriminator(globalConfig.slug, globalSchema)
    })

    return Globals
  }

  return null
}

const removeBranchFieldIndex = ({ fields }: { fields: Field[] }): Field[] =>
  fields.map((field) => {
    if (isBranchField(field)) {
      return { ...field, index: false, unique: false }
    }

    return field
  })

const isBranchField = (field: Field): field is TextField =>
  field.type === 'text' && field.name === branchField
