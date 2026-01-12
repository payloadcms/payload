import type { Field } from '../fields/config/types.js'
import type { Access, CollectionSlug } from '../index.js'
import type { CollectionPreferences } from '../preferences/types.js'
import type { Where } from '../types/index.js'

// Note: order matters here as it will change the rendered order in the UI
export const operations = ['read', 'update', 'delete'] as const

export type ConstraintOperation = (typeof operations)[number]

export type DefaultConstraint = 'everyone' | 'onlyMe' | 'specificUsers'

export type Constraint = DefaultConstraint | string // TODO: type `string` as the custom constraints provided by the config

export type QueryPreset = {
  access: {
    [operation in ConstraintOperation]: {
      constraint: DefaultConstraint
      users?: string[]
    }
  }
  columns: CollectionPreferences['columns']
  groupBy?: string
  id: number | string
  isShared: boolean
  relatedCollection: CollectionSlug
  title: string
  where: Where
}

export type QueryPresetConstraint = {
  access: Access<QueryPreset>
  fields?: Field[]
  label: string
  value: string
}

export type QueryPresetConstraints = QueryPresetConstraint[]
