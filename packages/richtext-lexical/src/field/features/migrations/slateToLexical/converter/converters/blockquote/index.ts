import type { SlateNodeConverterProvider } from '../../types.js'

import { BlockquoteConverterClient } from './client.js'
import { _SlateBlockquoteConverter } from './converter.js'

export const SlateBlockquoteConverter: SlateNodeConverterProvider = {
  ClientComponent: BlockquoteConverterClient,
  converter: _SlateBlockquoteConverter,
}
