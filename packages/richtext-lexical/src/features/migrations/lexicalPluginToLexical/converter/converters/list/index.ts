import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { ListConverterClient } from './client.js'
import { _ListConverter } from './converter.js'

export const ListConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: ListConverterClient,
  converter: _ListConverter,
}
