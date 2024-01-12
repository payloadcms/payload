import type { TFunction } from 'i18next'

import type { User } from '../../../../../auth'
import type { SanitizedConfig } from '../../../../../config/types'
import type { Field as FieldSchema } from '../../../../../fields/config/types'
import type { Data, Fields } from '../types'

import { fieldIsPresentationalOnly } from '../../../../../fields/config/types'
import { addFieldStatePromise } from './addFieldStatePromise'

type Args = {
  /**
   * if any parents is localized, then the field is localized. @default false
   */
  anyParentLocalized?: boolean
  /**
   * config is only needed for validation
   */
  config?: SanitizedConfig
  data: Data
  fields: FieldSchema[]
  fullData: Data
  id?: number | string
  /**
   * Whether to include parent fields in the state. @default true
   */
  includeParents?: boolean
  /**
   * Whether the field schema should be included in the state. @default false
   */
  includeSchema?: boolean
  /**
   * Whether to include unlocalized fields in the state. @default true
   */
  includeUnlocalizedFields?: boolean
  /**
   * operation is only needed for checking field conditions
   */
  locale: string
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
   * Whether to check the field's condition. @default true
   */
  shouldCheckConditions?: boolean
  /**
   * Whether to validate the field. @default true
   */
  shouldValidate?: boolean
  state?: Fields
  t: TFunction
  user: User
}

/**
 * Flattens the fields schema and fields data
 */
export const iterateFields = async ({
  id,
  anyParentLocalized = false,
  config,
  data,
  fields,
  fullData,
  includeParents = true,
  includeSchema = false,
  includeUnlocalizedFields = true,
  locale,
  operation,
  parentPassesCondition = true,
  path = '',
  preferences,
  shouldCheckConditions = true,
  shouldValidate = true,
  state = {},
  t,
  user,
}: Args): Promise<void> => {
  const promises = []
  fields.forEach((field) => {
    if (!fieldIsPresentationalOnly(field) && !field?.admin?.disabled) {
      let passesCondition = true
      if (shouldCheckConditions) {
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
          config,
          data,
          field,
          fullData,
          includeParents,
          includeSchema,
          includeUnlocalizedFields,
          locale,
          operation,
          passesCondition,
          path,
          preferences,
          shouldCheckConditions,
          shouldValidate,
          state,
          t,
          user,
        }),
      )
    }
  })
  await Promise.all(promises)
}
