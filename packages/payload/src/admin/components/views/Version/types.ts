import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'

export type CompareOption = {
  label: string
  options?: CompareOption[]
  relationTo?: string
  value: string
}

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
}
