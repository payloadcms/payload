/* eslint-disable no-param-reassign */
import type { NumberField } from 'payload/types'

type Args = {
  field: NumberField
  locale?: string
  numberRows: Record<string, unknown>[]
  ref: Record<string, unknown>
}

export const transformHasManyNumber = ({ field, locale, numberRows, ref }: Args) => {
  const result = numberRows.map(({ number }) => number)

  if (locale) {
    ref[field.name][locale] = result
  } else {
    ref[field.name] = result
  }
}
