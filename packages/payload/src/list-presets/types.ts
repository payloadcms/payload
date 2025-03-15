import type { Field } from '../fields/config/types.js'
import type { CollectionSlug } from '../index.js'
import type { ListPreferences } from '../preferences/types.js'
import type { Where } from '../types/index.js'

export const operations = ['delete', 'read', 'update'] as const

type Operation = (typeof operations)[number]

// TODO: this should just exist in `GeneratedTypes` instead
export type ListPreset = {
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

export type ListPresetConstraint = {
  fields: Field[]
  label: string
  value: string
}

export type ListPresetConstraints = ListPresetConstraint[]
