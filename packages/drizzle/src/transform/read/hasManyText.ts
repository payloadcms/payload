/* eslint-disable no-param-reassign */
import type { TextField } from 'payload/types'

type Args = {
  field: TextField
  locale?: string
  ref: Record<string, unknown>
  textRows: Record<string, unknown>[]
}

export const transformHasManyText = ({ field, locale, ref, textRows }: Args) => {
  const result = textRows.map(({ text }) => text)

  if (locale) {
    ref[field.name][locale] = result
  } else {
    ref[field.name] = result
  }
}
