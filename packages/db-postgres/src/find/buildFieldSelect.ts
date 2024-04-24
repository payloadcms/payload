/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import type { Block, FieldAffectingData, NamedTab, Select } from 'payload/types'

export const buildFieldSelect = ({
  field,
  select,
}: {
  field: Block | FieldAffectingData | NamedTab
  select?: Select | boolean
}) => {
  if (!select || typeof select === 'boolean') return select
  return select['slug' in field ? field.slug : field.name]
}
