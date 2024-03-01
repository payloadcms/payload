import type { SlateNodeConverterProvider } from '../../types'

import { UnknownConverterClient } from './client'
import { _SlateUnknownConverter } from './converter'

export const SlateUnknownConverter: SlateNodeConverterProvider = {
  ClientComponent: UnknownConverterClient,
  converter: _SlateUnknownConverter,
}
