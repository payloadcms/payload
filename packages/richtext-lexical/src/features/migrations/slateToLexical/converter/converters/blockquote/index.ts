import type { SlateNodeConverterProvider } from '../../types.js'

import { BlockquoteConverterClient } from './client.js'
import { _SlateBlockquoteConverter } from './converter.js'

export const SlateBlockquoteConverter: SlateNodeConverterProvider = {
  ClientFeature: BlockquoteConverterClient,
  converter: _SlateBlockquoteConverter,
}
