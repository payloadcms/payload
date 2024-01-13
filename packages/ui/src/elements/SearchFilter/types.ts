import type { FieldAffectingData } from 'payload/types'

export type Props = {
  fieldLabel?: string
  fieldName?: string
  handleChange?: (search: string) => void
  listSearchableFields?: FieldAffectingData[]
  modifySearchQuery?: boolean
}
