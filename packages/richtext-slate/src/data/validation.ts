import type { RichTextField, Validate } from 'payload/types'

import type { AdapterArguments } from '../types'

import { defaultRichTextValue } from './defaultValue'

export const richTextValidate: Validate<
  unknown,
  unknown,
  RichTextField<AdapterArguments>,
  RichTextField<AdapterArguments>
> = (value, { required, t }) => {
  if (required) {
    const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue)
    if (value && JSON.stringify(value) !== stringifiedDefaultValue) return true
    return t('validation:required')
  }

  return true
}
