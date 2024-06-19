import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { UnknownConverterClient } from './client.js'
import { _UnknownConverter } from './converter.js'

export const UnknownConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: UnknownConverterClient,
  converter: _UnknownConverter,
}
