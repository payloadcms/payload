import type { TextField } from 'payload'

type Args = {
  field: TextField
  locale?: string
  ref: Record<string, unknown>
  textRows: Record<string, unknown>[]
  withinArrayOrBlockLocale?: string
}

export const transformHasManyText = ({
  field,
  locale,
  ref,
  textRows,
  withinArrayOrBlockLocale,
}: Args) => {
  let result: unknown[]

  if (withinArrayOrBlockLocale) {
    result = textRows.reduce((acc, { locale, text }) => {
      if (locale === withinArrayOrBlockLocale) {
        acc.push(text)
      }

      return acc
    }, [])
  } else {
    result = textRows.map(({ text }) => text)
  }

  if (locale) {
    ref[field.name][locale] = result
  } else {
    ref[field.name] = result
  }
}
