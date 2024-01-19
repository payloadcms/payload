import type { I18n } from '@payloadcms/translations'

export type LabelProps = {
  htmlFor?: string
  i18n: I18n
  label?: JSX.Element | Record<string, string> | false | string
  required?: boolean
}
