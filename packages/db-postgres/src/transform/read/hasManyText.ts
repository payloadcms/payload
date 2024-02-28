/* eslint-disable no-param-reassign */
import type { TextField } from 'payload/types'

type Args = {
  field: TextField
  locale?: string
  textRows: Record<string, unknown>[]
  ref: Record<string, unknown>
}

export const transformHasManyText = ({ field, locale, textRows, ref }: Args) => {
  const result = textRows.map(({ text }) => text)

  if (locale) {
    ref[field.name][locale] = result
  } else {
    ref[field.name] = result
  }
}
