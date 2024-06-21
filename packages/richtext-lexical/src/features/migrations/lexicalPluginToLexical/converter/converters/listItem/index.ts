import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { ListItemConverterClient } from './client.js'
import { _ListItemConverter } from './converter.js'

export const ListItemConverter: LexicalPluginNodeConverterProvider = {
  ClientFeature: ListItemConverterClient,
  converter: _ListItemConverter,
}
