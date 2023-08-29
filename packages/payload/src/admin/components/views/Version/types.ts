import { SanitizedCollectionConfig } from '../../../../collections/config/types.js';
import { SanitizedGlobalConfig } from '../../../../globals/config/types.js';

export type LocaleOption = {
  label: string
  code: string
}

export type CompareOption = {
  label: string
  value: string
  relationTo?: string
  options?: CompareOption[]
}

export type Props = {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
}
