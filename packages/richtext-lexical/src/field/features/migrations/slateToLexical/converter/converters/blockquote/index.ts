import type { SlateNodeConverterProvider } from '../../types'

import { BlockQuoteConverterClient } from './client'
import { _SlateBlockquoteConverter } from './converter'

export const SlateBlockquoteConverter: SlateNodeConverterProvider = {
  ClientComponent: BlockQuoteConverterClient,
  converter: _SlateBlockquoteConverter,
}
