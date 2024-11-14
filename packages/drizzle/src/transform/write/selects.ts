import { isArrayOfRows } from '../../utilities/isArrayOfRows.js'

type Args = {
  data: unknown
  id?: unknown
  locale?: string
}

export const transformSelects = ({ id, data, locale }: Args) => {
  const newRows: Record<string, unknown>[] = []

  if (isArrayOfRows(data)) {
    data.forEach((value, i) => {
      const newRow: Record<string, unknown> = {
        order: i + 1,
        parent: id,
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
