import type { Data, Field as FieldSchema, FormState, PayloadRequest } from 'payload/types'

import { fieldIsPresentationalOnly } from 'payload/types'

import type { AddFieldStatePromiseArgs } from './addFieldStatePromise.js'

import { addFieldStatePromise } from './addFieldStatePromise.js'

type Args = {
  /**
   * if any parents is localized, then the field is localized. @default false
   */
  anyParentLocalized?: boolean
  data: Data
  errorPaths: string[]
  fields: FieldSchema[]
  filter?: (args: AddFieldStatePromiseArgs) => boolean
  /**
   * Force the value of fields like arrays or blocks to be the full value instead of the length @default false
   */
  forceFullValue?: boolean
  fullData: Data
  id?: number | string
  /**
   * Whether the field schema should be included in the state. @default false
   */
  includeSchema?: boolean
  /**
   * Whether to omit parent fields in the state. @default false
   */
  omitParents?: boolean
  /**
   * operation is only needed for validation
   */
  operation: 'create' | 'update'
  parentPassesCondition?: boolean
  /**
   * The initial path of the field. @default ''
   */
  path?: string
  preferences?: {
    [key: string]: unknown
  }
  req: PayloadRequest
  /**
   * Whether to skip checking the field's condition. @default false
   */
  skipConditionChecks?: boolean
  /**
   * Whether to skip validating the field. @default false
   */
  skipValidation?: boolean
  state?: FormState
}

/**
 * Flattens the fields schema and fields data
 */
export const iterateFields = async ({
  id,
  anyParentLocalized = false,
  data,
  errorPaths,
  fields,
  filter,
  forceFullValue = false,
  fullData,
  includeSchema = false,
  omitParents = false,
  operation,
  parentPassesCondition = true,
  path = '',
  preferences,
  req,
  skipConditionChecks = false,
  skipValidation = false,
  state = {},
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field) => {
    if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
      let passesCondition = true
      if (!skipConditionChecks) {
        passesCondition = Boolean(
          (field?.admin?.condition
            ? Boolean(field.admin.condition(fullData || {}, data || {}, { user: req.user }))
            : true) && parentPassesCondition,
        )
      }

      promises.push(
        addFieldStatePromise({
          id,
          anyParentLocalized,
          data,
          errorPaths,
          field,
          filter,
          forceFullValue,
          fullData,
          includeSchema,
          omitParents,
          operation,
          passesCondition,
          path,
          preferences,
          req,
          skipConditionChecks,
          skipValidation,
          state,
        }),
      )
    }
  })

  await Promise.all(promises)
}
