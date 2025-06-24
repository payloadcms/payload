import type { NumberField } from 'payload'

type Args = {
  field: NumberField
  locale?: string
  numberRows: Record<string, unknown>[]
  ref: Record<string, unknown>
  withinArrayOrBlockLocale?: string
}

export const transformHasManyNumber = ({
  field,
  locale,
  numberRows,
  ref,
  withinArrayOrBlockLocale,
}: Args) => {
  let result: unknown[]

  if (withinArrayOrBlockLocale) {
    result = numberRows.reduce((acc, { locale, number }) => {
      if (locale === withinArrayOrBlockLocale) {
        if (typeof number === 'string') {
          number = Number(number)
        }
        acc.push(number)
      }

      return acc
    }, [])
  } else {
    result = numberRows.map(({ number }) => {
      if (typeof number === 'string') {
        number = Number(number)
      }
      return number
    })
  }

  if (locale) {
    ref[field.name][locale] = result
  } else {
    ref[field.name] = result
  }
}
