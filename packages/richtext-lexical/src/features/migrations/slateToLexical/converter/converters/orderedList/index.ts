import type { SlateNodeConverterProvider } from '../../types.js'

import { OrderedListConverterClient } from './client.js'
import { _SlateOrderedListConverter } from './converter.js'

export const SlateOrderedListConverter: SlateNodeConverterProvider = {
  ClientConverter: OrderedListConverterClient,
  converter: _SlateOrderedListConverter,
}
