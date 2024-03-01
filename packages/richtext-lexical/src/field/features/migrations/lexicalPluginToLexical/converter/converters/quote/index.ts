import type { LexicalPluginNodeConverterProvider } from '../../types'

import { QuoteConverterClient } from './client'
import { _QuoteConverter } from './converter'

export const QuoteConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: QuoteConverterClient,
  converter: _QuoteConverter,
}
