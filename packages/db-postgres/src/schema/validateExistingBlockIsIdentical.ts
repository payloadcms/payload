import type { Block } from 'payload/types'

import { InvalidConfiguration } from 'payload/errors'
import { flattenTopLevelFields } from 'payload/utilities'

import type { GenericTable } from '../types'

type Args = {
  block: Block
  localized: boolean
  rootTableName: string
  table: GenericTable
}

export const validateExistingBlockIsIdentical = ({
  block,
  localized,
  rootTableName,
  table,
}: Args): void => {
  if (table) {
    const fieldNames = flattenTopLevelFields(block.fields).flatMap((field) => field.name)

    Object.keys(table).forEach((fieldName) => {
      if (!['_locale', '_order', '_parentID', '_path', '_uuid'].includes(fieldName)) {
        if (fieldNames.indexOf(fieldName) === -1) {
          throw new InvalidConfiguration(
            `The table ${rootTableName} has multiple blocks with slug ${block.slug}, but the schemas do not match. One block includes the field ${fieldName}, while the other block does not.`,
          )
        }
      }
    })

    if (Boolean(localized) !== Boolean(table._locale)) {
      throw new InvalidConfiguration(
        `The table ${rootTableName} has multiple blocks with slug ${block.slug}, but the schemas do not match. One is localized, but another is not. Block schemas of the same name must match exactly.`,
      )
    }
  }
}
