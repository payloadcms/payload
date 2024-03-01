import type { SlateNodeConverterProvider } from '../../types'

import { OrderedListConverterClient } from './client'
import { _SlateOrderedListConverter } from './converter'

export const SlateOrderedListConverter: SlateNodeConverterProvider = {
  ClientComponent: OrderedListConverterClient,
  converter: _SlateOrderedListConverter,
}
