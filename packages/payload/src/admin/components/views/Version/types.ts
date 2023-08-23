import { SanitizedCollectionConfig } from '../../../../collections/config/types';
import { SanitizedGlobalConfig } from '../../../../globals/config/types';

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
