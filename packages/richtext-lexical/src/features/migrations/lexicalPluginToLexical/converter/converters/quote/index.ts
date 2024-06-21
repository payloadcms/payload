import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { QuoteConverterClient } from './client.js'
import { _QuoteConverter } from './converter.js'

export const QuoteConverter: LexicalPluginNodeConverterProvider = {
  ClientConverter: QuoteConverterClient,
  converter: _QuoteConverter,
}
