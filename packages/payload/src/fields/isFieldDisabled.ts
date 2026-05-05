export type DisabledArea = 'bulkEdit' | 'column' | 'edit' | 'filter' | 'groupBy'

export type DisabledOptions = {
  bulkEdit?: boolean
  column?: boolean
  edit?: boolean
  filter?: boolean
  groupBy?: boolean
}

export const isFieldDisabled = (
  field: { admin?: null | Record<string, unknown> } | null | undefined,
  area: DisabledArea,
): boolean => {
  if (!field || !field.admin) {
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
