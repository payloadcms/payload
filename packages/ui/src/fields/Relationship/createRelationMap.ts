'use client'
import type { HasManyValueUnion } from './types.js'

type RelationMap = {
  [relation: string]: (number | string)[]
}

type CreateRelationMap = (
  args: {
    relationTo: string[]
  } & HasManyValueUnion,
) => RelationMap

export const createRelationMap: CreateRelationMap = ({ hasMany, relationTo, value }) => {
  const relationMap: RelationMap = relationTo.reduce((map, current) => {
    return { ...map, [current]: [] }
  }, {})

  if (value === null) {
    return relationMap
  }

  if (value) {
    const add = (relation: string, id: number | string) => {
      if ((typeof id === 'string' || typeof id === 'number') && typeof relation === 'string') {
        if (relationMap[relation]) {
          relationMap[relation].push(id)
        } else {
          relationMap[relation] = [id]
        }
      }
    }
    if (hasMany === true) {
      value.forEach((val) => {
        if (val) {
          add(val.relationTo, val.value)
        }
      })
    } else {
      add(value.relationTo, value.value)
    }
  }

  return relationMap
}
