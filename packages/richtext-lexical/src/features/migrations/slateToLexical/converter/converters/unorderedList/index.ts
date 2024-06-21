import type { SlateNodeConverterProvider } from '../../types.js'

import { UnorderedListConverterClient } from './client.js'
import { _SlateUnorderedListConverter } from './converter.js'

export const SlateUnorderedListConverter: SlateNodeConverterProvider = {
  ClientFeature: UnorderedListConverterClient,
  converter: _SlateUnorderedListConverter,
}
