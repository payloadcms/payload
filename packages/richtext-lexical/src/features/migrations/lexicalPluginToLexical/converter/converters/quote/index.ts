import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { QuoteConverterClient } from './client.js'
import { _QuoteConverter } from './converter.js'

export const QuoteConverter: LexicalPluginNodeConverterProvider = {
  ClientFeature: QuoteConverterClient,
  converter: _QuoteConverter,
}
