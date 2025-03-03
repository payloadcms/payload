import type { Field } from '../fields/config/types.js'
import type { CollectionSlug } from '../index.js'
import type { ListPreferences } from '../preferences/types.js'
import type { Where } from '../types/index.js'

// TODO: this should just exist in `GeneratedTypes` instead
export type ListPreset = {
  columns: ListPreferences['columns']
  id: number | string
  relatedCollection: CollectionSlug
  title: string
  where: Where
}

export type ListPresetConstraint = {
  fields: Field[]
  label: string
  value: string
}

export type ListPresetConstraints = ListPresetConstraint[]
