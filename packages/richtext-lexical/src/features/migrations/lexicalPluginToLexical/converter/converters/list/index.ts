import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { ListConverterClient } from './client.js'
import { _ListConverter } from './converter.js'

export const ListConverter: LexicalPluginNodeConverterProvider = {
  ClientConverter: ListConverterClient,
  converter: _ListConverter,
}
