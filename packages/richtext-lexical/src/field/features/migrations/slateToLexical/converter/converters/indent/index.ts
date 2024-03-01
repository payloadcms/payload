import type { SlateNodeConverterProvider } from '../../types'

import { IndentConverterClient } from './client'
import { _SlateIndentConverter } from './converter'

export const SlateIndentConverter: SlateNodeConverterProvider = {
  ClientComponent: IndentConverterClient,
  converter: _SlateIndentConverter,
}
