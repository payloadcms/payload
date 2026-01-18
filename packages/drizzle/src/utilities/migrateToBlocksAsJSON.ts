import { readFileSync } from 'fs'
import { APIError } from 'payload'
import * as ts from 'typescript'

import type { DrizzleAdapter, SetColumnID } from '../types.js'

import { buildRawSchema } from '../schema/buildRawSchema.js'

export const createBlocksToJsonMigrator = (setColumnID: SetColumnID) =>
  async function (this: DrizzleAdapter) {
    if (this.blocksAsJSON) {
      throw new APIError('adapter.blocksAsJSON is set to true. ')
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

    console.log(deletedTables)

    await Promise.resolve(1)
  }
