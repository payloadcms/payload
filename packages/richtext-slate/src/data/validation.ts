import type { RichTextField, Validate } from 'payload/types'

import type { AdapterArguments } from '../types'

import { defaultRichTextValue } from './defaultValue'

export const richTextValidate: Validate<
  unknown[],
  unknown,
  RichTextField<any[], AdapterArguments>,
  RichTextField<any[], AdapterArguments>
> = (value, { required }) => {
  if (required) {
    const stringifiedDefaultValue = JSON.stringify(defaultRichTextValue)
    if (value && JSON.stringify(value) !== stringifiedDefaultValue) return true
    // TODO: translate this string
    return 'This field is required.'
  }

  return true
}
