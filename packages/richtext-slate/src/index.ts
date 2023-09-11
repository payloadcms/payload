import type { RichTextAdapter } from 'payload'

import type { AdapterArguments } from './types'

import { RichTextEditor } from './field/RichText'

export function createSlate(args: AdapterArguments): RichTextAdapter {
  return {
    component: RichTextEditor,
  }
}
