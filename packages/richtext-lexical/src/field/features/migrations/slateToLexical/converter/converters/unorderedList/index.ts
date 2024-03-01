import type { SlateNodeConverterProvider } from '../../types'

import { UnorderedListConverterClient } from './client'
import { _SlateUnorderedListConverter } from './converter'

export const SlateUnorderedListConverter: SlateNodeConverterProvider = {
  ClientComponent: UnorderedListConverterClient,
  converter: _SlateUnorderedListConverter,
}
