import type { Field } from '../../../../fields/config/types'

import flattenFields from '../../../../utilities/flattenTopLevelFields'

const getInitialColumnState = (
  fields: Field[],
  useAsTitle: string,
  defaultColumns: string[],
): string[] => {
  let initialColumns = []

  if (Array.isArray(defaultColumns) && defaultColumns.length >= 1) {
    return defaultColumns
  }

  if (useAsTitle) {
    initialColumns.push(useAsTitle)
  }

  const flattenedFields = flattenFields(fields)
  const remainingColumns = flattenedFields
    .map((field) => {
      if (field.name !== useAsTitle) {
        return field.name
      }
    })
    .filter(Boolean)

  initialColumns = initialColumns.concat(remainingColumns)
  initialColumns = initialColumns.slice(0, 4)
  return initialColumns
}

export default getInitialColumnState
