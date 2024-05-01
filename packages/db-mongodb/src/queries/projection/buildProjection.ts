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
  if (!select || typeof select === 'boolean') return

  let projection = ''

  const addProjection = (path: string) => {
    if (!projection) projection = path
    else projection += ' ' + path
  }

  traverseFields({
    addProjection,
    fields,
    localeCodes,
    select,
  })

  return projection
}
