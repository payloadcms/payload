import type { SelectType } from 'payload'

/**
 * Takes an input of array of string paths in dot notation and returns a select object
 * example args: ['id', 'title', 'group.value', 'createdAt', 'updatedAt']
 */
export const getSelect = (fields: string[]): SelectType => {
  const select: SelectType = {}

  fields.forEach((field) => {
    // TODO: this can likely be removed, the form was not saving, leaving in for now
    if (!field) {
      return
    }
    const segments = field.split('.')
    let selectRef = select

    segments.forEach((segment, i) => {
      if (i === segments.length - 1) {
        selectRef[segment] = true
      } else {
        if (!selectRef[segment]) {
          selectRef[segment] = {}
        }
        selectRef = selectRef[segment] as SelectType
      }
    })
  })

  return select
}
