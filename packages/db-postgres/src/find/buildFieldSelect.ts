/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import type { FieldAffectingData, NamedTab, Select } from 'packages/payload/src/exports/types.js'

export const buildFieldSelect = ({
  field,
  select,
}: {
  field: FieldAffectingData | NamedTab
  select?: Select | boolean
}) => {
  if (!select || typeof select === 'boolean') return select
  return select[field.name]
}
