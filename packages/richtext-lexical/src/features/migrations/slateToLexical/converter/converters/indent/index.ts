import type { SlateNodeConverterProvider } from '../../types.js'

import { IndentConverterClient } from './client.js'
import { _SlateIndentConverter } from './converter.js'

export const SlateIndentConverter: SlateNodeConverterProvider = {
  ClientFeature: IndentConverterClient,
  converter: _SlateIndentConverter,
}
