import type { SlateNodeConverterProvider } from '../../types.js'

import { BlockQuoteConverterClient } from './client.js'
import { _SlateBlockquoteConverter } from './converter.js'

export const SlateBlockquoteConverter: SlateNodeConverterProvider = {
  ClientComponent: BlockQuoteConverterClient,
  converter: _SlateBlockquoteConverter,
}
