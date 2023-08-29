import type { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../../../globals/config/types.js';

export type LocaleOption = {
  code: string
  label: string
}

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
