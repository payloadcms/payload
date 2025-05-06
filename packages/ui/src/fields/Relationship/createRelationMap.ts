'use client'
import type { Value } from './types.js'

type RelationMap = {
  [relation: string]: (number | string)[]
}

type CreateRelationMap = (args: {
  hasMany: boolean
  isPolymorphic: boolean
  relationTo: string[]
  value: null | Value | Value[] // really needs to be `ValueWithRelation`
}) => RelationMap

export const createRelationMap: CreateRelationMap = ({
  hasMany,
  isPolymorphic,
  relationTo,
  value,
}) => {
  const relationMap: RelationMap = relationTo.reduce((map, current) => {
    return { ...map, [current]: [] }
  }, {})

  if (value === null) {
    return relationMap
  }

  const add = (relation: string, id: unknown) => {
    if ((typeof id === 'string' || typeof id === 'number') && typeof relation === 'string') {
      if (relationMap[relation]) {
        relationMap[relation].push(id)
      } else {
        relationMap[relation] = [id]
      }
    }
  }

  if (hasMany && Array.isArray(value)) {
    value.forEach((val) => {
      if (isPolymorphic && typeof val === 'object' && 'relationTo' in val && 'value' in val) {
        add(val.relationTo, val.value)
      }

      if (!isPolymorphic && typeof relationTo === 'string') {
        add(relationTo, val)
      }
    })
  } else if (isPolymorphic) {
    if (typeof value === 'object' && 'relationTo' in value && 'value' in value) {
      add(value.relationTo, value.value)
    }
  } else {
    add(relationTo[0], value)
  }

  return relationMap
}
