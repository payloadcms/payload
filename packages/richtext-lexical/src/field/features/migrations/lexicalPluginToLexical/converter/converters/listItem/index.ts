import type { LexicalPluginNodeConverterProvider } from '../../types'

import { ListItemConverterClient } from './client'
import { _ListItemConverter } from './converter'

export const ListItemConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: ListItemConverterClient,
  converter: _ListItemConverter,
}
