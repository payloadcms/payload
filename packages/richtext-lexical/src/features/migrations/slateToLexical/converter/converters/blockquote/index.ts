import type { SlateNodeConverterProvider } from '../../types.js'

import { BlockquoteConverterClient } from './client.js'
import { _SlateBlockquoteConverter } from './converter.js'

export const SlateBlockquoteConverter: SlateNodeConverterProvider = {
  ClientConverter: BlockquoteConverterClient,
  converter: _SlateBlockquoteConverter,
}
