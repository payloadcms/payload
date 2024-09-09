import type { RelationshipField, UploadField } from 'payload'

import { valueIsValueWithRelation } from 'payload/shared'

type Args = {
  baseRow: Record<string, unknown>
  data: unknown
  field: RelationshipField | UploadField
  relationships: Record<string, unknown>[]
}

export const transformRelationship = ({ baseRow, data, field, relationships }: Args) => {
  const relations = Array.isArray(data) ? data : [data]

  relations.forEach((relation, i) => {
    if (relation) {
      const relationRow = { ...baseRow }
      if ('hasMany' in field && field.hasMany) {
        relationRow.order = i + 1
      }

      if (Array.isArray(field.relationTo) && valueIsValueWithRelation(relation)) {
        relationRow[`${relation.relationTo}ID`] = relation.value
        relationships.push(relationRow)
      } else {
        relationRow[`${field.relationTo}ID`] = relation
        if (relation) {
          relationships.push(relationRow)
        }
      }
    }
  })
}
