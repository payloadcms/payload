import type { Field } from '../fields/config/types.js'
import type { CollectionSlug } from '../index.js'
import type { ListPreferences } from '../preferences/types.js'
import type { Where } from '../types/index.js'

// Note: order matters here as it will change the rendered order in the UI
export const operations = ['read', 'update', 'delete'] as const

type Operation = (typeof operations)[number]

// TODO: this should just exist in `GeneratedTypes` instead
export type QueryPreset = {
  access: Access
  columns: ListPreferences['columns']
  id: number | string
  isShared: boolean
  relatedCollection: CollectionSlug
  title: string
  where: Where
}

// TODO: this should just exist in `GeneratedTypes` instead
export type Access = {
  [operation in Operation]: {
    constraint: 'everyone' | 'onlyMe' | 'specificUsers'
    users?: string[]
  }
}

export type QueryPresetConstraint = {
  fields: Field[]
  label: string
  value: string
}

export type QueryPresetConstraints = QueryPresetConstraint[]
