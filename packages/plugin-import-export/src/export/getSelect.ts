import type { SelectIncludeType } from 'payload'

/**
 * Takes an input of array of string paths in dot notation and returns a select object
 * example args: ['id', 'title', 'group.value', 'createdAt', 'updatedAt']
 */
export const getSelect = (fields: string[]): SelectIncludeType => {
  const select: SelectIncludeType = {}

  fields.forEach((field) => {
    const segments = field.split('.')
    let selectRef = select

    segments.forEach((segment, i) => {
      if (i === segments.length - 1) {
        selectRef[segment] = true
      } else {
        if (!selectRef[segment]) {
          selectRef[segment] = {}
        }
        selectRef = selectRef[segment] as SelectIncludeType
      }
    })
  })

  return select
}
