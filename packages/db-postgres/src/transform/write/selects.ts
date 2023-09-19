/* eslint-disable no-param-reassign */
import { isArrayOfRows } from '../../utilities/isArrayOfRows'

type Args = {
  data: unknown
  locale?: string
}

export const transformSelects = ({ data, locale }: Args) => {
  const newRows: Record<string, unknown>[] = []

  if (isArrayOfRows(data)) {
    data.forEach((value, i) => {
      const newRow: Record<string, unknown> = {
        order: i + 1,
        value,
      }

      if (locale) {
        newRow.locale = locale
      }

      newRows.push(newRow)
    })
  }

  return newRows
}
