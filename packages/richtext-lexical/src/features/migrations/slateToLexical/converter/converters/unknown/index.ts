import type { SlateNodeConverterProvider } from '../../types.js'

import { UnknownConverterClient } from './client.js'
import { _SlateUnknownConverter } from './converter.js'

export const SlateUnknownConverter: SlateNodeConverterProvider = {
  ClientConverter: UnknownConverterClient,
  converter: _SlateUnknownConverter,
}
