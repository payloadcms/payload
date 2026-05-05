import type { ClientField, Field, TabAsField, TabAsFieldClient } from './config/types.js'

export type DisabledArea = 'bulkEdit' | 'column' | 'edit' | 'filter' | 'groupBy'

export type DisabledOptions = {
  bulkEdit?: boolean
  column?: boolean
  edit?: boolean
  filter?: boolean
  groupBy?: boolean
}

type AnyField = ClientField | Field | TabAsField | TabAsFieldClient

export const isFieldDisabled = (field: AnyField, area: DisabledArea): boolean => {
  if (!('admin' in field) || !field.admin) {
    return false
  }
  const disabled = (field.admin as { disabled?: boolean | DisabledOptions }).disabled
  if (disabled === true) {
    return true
  }
  if (typeof disabled === 'object' && disabled !== null) {
    return disabled[area] === true
  }
  return false
}
