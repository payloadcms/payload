import type { FieldAffectingData } from '../../../../fields/config/types'

export type Props = {
  fieldLabel?: string
  fieldName?: string
  handleChange?: (search: string) => void
  listSearchableFields?: FieldAffectingData[]
  modifySearchQuery?: boolean
}
