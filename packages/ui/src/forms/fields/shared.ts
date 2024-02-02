import type { Locale, SanitizedLocalizationConfig } from 'payload/config'
import { User } from 'payload/auth'
import {
  ArrayField,
  BlockField,
  CodeField,
  DateField,
  DocumentPreferences,
  JSONField,
  RelationshipField,
  RowLabel,
  UploadField,
  Validate,
} from 'payload/types'
import { Option } from 'payload/types'
import { FormState } from '../..'
import type { FieldMap, ReducedBlock, ReducedTab } from '../utilities/buildFieldMaps/types'

export const fieldBaseClass = 'field-type'

export type FormFieldBase = {
  path?: string
  user?: User
  docPreferences?: DocumentPreferences
  locale?: Locale
  BeforeInput?: React.ReactNode
  AfterInput?: React.ReactNode
  Label?: React.ReactNode
  Description?: React.ReactNode
  Error?: React.ReactNode
  fieldMap?: FieldMap
  initialSubfieldState?: FormState
  style?: React.CSSProperties
  width?: string
  className?: string
  label?: RowLabel
  readOnly?: boolean
  rtl?: boolean
  maxLength?: number
  minLength?: number
  required?: boolean
  placeholder?: string
  localized?: boolean
  validate?: Validate
} & (
  | {
      // For `number` fields
      step?: number
      hasMany?: boolean
      maxRows?: number
      min?: number
      max?: number
    }
  | {
      // For `radio` fields
      layout?: 'horizontal' | 'vertical'
      options?: Option[]
    }
  | {
      // For `textarea` fields
      rows?: number
    }
  | {
      // For `select` fields
      isClearable?: boolean
      isSortable?: boolean
    }
  | {
      tabs?: ReducedTab[]
    }
  | {
      // For `code` fields
      editorOptions?: CodeField['admin']['editorOptions']
      language?: CodeField['admin']['language']
    }
  | {
      // For `json` fields
      editorOptions?: JSONField['admin']['editorOptions']
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
      // For `array` fields
      minRows?: ArrayField['minRows']
      maxRows?: ArrayField['maxRows']
      labels?: ArrayField['labels']
    }
  | {
      // For `blocks` fields
      slug?: string
      minRows?: BlockField['minRows']
      maxRows?: BlockField['maxRows']
      labels?: BlockField['labels']
      blocks?: ReducedBlock[]
    }
  | {
      // For `upload` fields
      relationTo?: UploadField['relationTo']
    }
  | {
      // For `relationship` fields
      relationTo?: RelationshipField['relationTo']
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
