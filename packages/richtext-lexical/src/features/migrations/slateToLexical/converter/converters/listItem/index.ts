import type { SlateNodeConverterProvider } from '../../types.js'

import { ListItemConverterClient } from './client.js'
import { _SlateListItemConverter } from './converter.js'

export const SlateListItemConverter: SlateNodeConverterProvider = {
  ClientConverter: ListItemConverterClient,
  converter: _SlateListItemConverter,
}
