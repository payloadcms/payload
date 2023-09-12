import type { RichTextAdapter } from 'payload/types'

import type { AdapterArguments } from './types'

import RichTextField from './field'

export function createSlate(args: AdapterArguments): RichTextAdapter {
  return {
    component: RichTextField,
  }
}
