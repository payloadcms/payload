/* eslint-disable no-console */
import type { PopulateType, SelectType } from '../../../index.js'

export const getReadOptions = (options: {
  depth: number
  fallbackLocale?: false | string
  locale?: string
  overrideAccess: boolean
  populate?: PopulateType
  select?: SelectType
  showHiddenFields?: boolean
}) => ({
  depth: options.depth,
  fallbackLocale: options.fallbackLocale,
  locale: options.locale,
  overrideAccess: options.overrideAccess,
  populate: options.populate,
  select: options.select,
  showHiddenFields: options.showHiddenFields,
})

export const printJSON = (value: unknown): void => {
  console.log(
    JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item), 2),
  )
}
