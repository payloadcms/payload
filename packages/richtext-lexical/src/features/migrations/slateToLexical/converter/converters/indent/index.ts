import type { SlateNodeConverterProvider } from '../../types.js'

import { IndentConverterClient } from './client.js'
import { _SlateIndentConverter } from './converter.js'

export const SlateIndentConverter: SlateNodeConverterProvider = {
  ClientConverter: IndentConverterClient,
  converter: _SlateIndentConverter,
}
