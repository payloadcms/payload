import type { FieldPermissions, User } from 'payload/auth'
import type { Locale, SanitizedLocalizationConfig } from 'payload/config'
import type {
  ArrayField,
  BlockField,
  CodeField,
  DateField,
  DocumentPreferences,
  FormState,
  JSONField,
  RelationshipField,
  RowLabel,
  UploadField,
  Validate,
} from 'payload/types'
import type { Option } from 'payload/types'

import type {
  FieldMap,
  MappedField,
  MappedTab,
  ReducedBlock,
} from '../../utilities/buildComponentMap/types.js'

export const fieldBaseClass = 'field-type'

export type FormFieldBase = {
  AfterInput?: React.ReactNode
  BeforeInput?: React.ReactNode
  Description?: React.ReactNode
  Error?: React.ReactNode
  Label?: React.ReactNode
  className?: string
  disabled?: boolean
  docPreferences?: DocumentPreferences
  fieldMap?: FieldMap
  initialSubfieldState?: FormState
  label?: string
  locale?: Locale
  localized?: boolean
  maxLength?: number
  minLength?: number
  path?: string
  placeholder?: string
  readOnly?: boolean
  required?: boolean
  rtl?: boolean
  style?: React.CSSProperties
  user?: User
  validate?: Validate
  width?: string
} & (
  | {
      // For `code` fields
      editorOptions?: CodeField['admin']['editorOptions']
      language?: CodeField['admin']['language']
    }
  | {
      // For `collapsible` fields
      initCollapsed?: boolean
    }
  | {
      // For `date` fields
      date?: DateField['admin']['date']
    }
  | {
      // For `json` fields
      editorOptions?: JSONField['admin']['editorOptions']
    }
  | {
      // For `radio` fields
      layout?: 'horizontal' | 'vertical'
      options?: Option[]
    }
  | {
      // For `richText` fields
      richTextComponentMap?: Map<string, MappedField[] | React.ReactNode>
    }
  | {
      // For `select` fields
      isClearable?: boolean
      isSortable?: boolean
    }
  | {
      // For `textarea` fields
      rows?: number
    }
  | {
      // For `upload` fields
      relationTo?: UploadField['relationTo']
    }
  | {
      allowCreate?: RelationshipField['admin']['allowCreate']
      filterOptions?: RelationshipField['filterOptions']
      // For `relationship` fields
      relationTo?: RelationshipField['relationTo']
      sortOptions?: RelationshipField['admin']['sortOptions']
    }
  | {
      blocks?: ReducedBlock[]
      labels?: BlockField['labels']
      maxRows?: BlockField['maxRows']
      minRows?: BlockField['minRows']
      // For `blocks` fields
      slug?: string
    }
  | {
      hasMany?: boolean
      max?: number
      maxRows?: number
      min?: number
      // For `number` fields
      step?: number
    }
  | {
      label?: RowLabel
      labels?: ArrayField['labels']
      maxRows?: ArrayField['maxRows']
      // For `array` fields
      minRows?: ArrayField['minRows']
    }
  | {
      tabs?: MappedTab[]
    }
)

/**
 * Determines whether a field should be displayed as right-to-left (RTL) based on its configuration, payload's localization configuration and the adming user's currently enabled locale.

 * @returns Whether the field should be displayed as RTL.
 */
export function isFieldRTL({
  fieldLocalized,
  fieldRTL,
  locale,
  localizationConfig,
}: {
  fieldLocalized: boolean
  fieldRTL: boolean
  locale: Locale
  localizationConfig?: SanitizedLocalizationConfig
}) {
  const hasMultipleLocales =
    locale &&
    localizationConfig &&
    localizationConfig.locales &&
    localizationConfig.locales.length > 1

  const isCurrentLocaleDefaultLocale = locale?.code === localizationConfig?.defaultLocale

  return (
    (fieldRTL !== false &&
      locale?.rtl === true &&
      (fieldLocalized ||
        (!fieldLocalized && !hasMultipleLocales) || // If there is only one locale which is also rtl, that field is rtl too
        (!fieldLocalized && isCurrentLocaleDefaultLocale))) || // If the current locale is the default locale, but the field is not localized, that field is rtl too
    fieldRTL === true
  ) // If fieldRTL is true. This should be useful for when no localization is set at all in the payload config, but you still want fields to be rtl.
}
