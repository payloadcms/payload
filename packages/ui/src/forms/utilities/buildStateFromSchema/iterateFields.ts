import type { TFunction } from '@payloadcms/translations'
import type { User } from 'payload/auth'
import type { Data, Field as FieldSchema } from 'payload/types'

import { fieldIsPresentationalOnly } from 'payload/types'

import type { FormState } from '../../Form/types'
import type { AddFieldStatePromiseArgs } from './addFieldStatePromise'

import { addFieldStatePromise } from './addFieldStatePromise'

type Args = {
  /**
   * if any parents is localized, then the field is localized. @default false
   */
  anyParentLocalized?: boolean
  data: Data
  errorPaths: Set<string>
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
   * locale is only needed for checking field conditions
   */
  locale: string
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
  /**
   * Whether to skip checking the field's condition. @default false
   */
  skipConditionChecks?: boolean
  /**
   * Whether to skip validating the field. @default false
   */
  skipValidation?: boolean
  state?: FormState
  t: TFunction
  user: User
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
  locale,
  omitParents = false,
  operation,
  parentPassesCondition = true,
  path = '',
  preferences,
  skipConditionChecks = false,
  skipValidation = false,
  state = {},
  t,
  user,
}: Args): Promise<void> => {
  const promises = []

  fields.forEach((field) => {
    if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
      let passesCondition = true
      if (!skipConditionChecks) {
        passesCondition = Boolean(
          (field?.admin?.condition
            ? Boolean(field.admin.condition(fullData || {}, data || {}, { user }))
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
          locale,
          omitParents,
          operation,
          passesCondition,
          path,
          preferences,
          skipConditionChecks,
          skipValidation,
          state,
          t,
          user,
        }),
      )
    }
  })

  await Promise.all(promises)
}
