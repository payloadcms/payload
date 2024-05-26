import type { Field, Select } from 'payload/types'

import { traverseFields } from './traverseFields.js'

export const buildProjection = ({
  fields,
  localeCodes,
  select,
}: {
  fields: Field[]
  localeCodes: string[]
  select?: Select
}) => {
  if (!select) return

  const projection: string[] = []

  const addProjection = (path: string) => {
    if (projection.includes(path)) return
    projection.push(path)
  }

  traverseFields({
    addProjection,
    fields,
    localeCodes,
    select,
  })

  return projection
}
