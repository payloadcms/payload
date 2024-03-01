import type { SlateNodeConverterProvider } from '../../types'

import { ListItemConverterClient } from './client'
import { _SlateListItemConverter } from './converter'

export const SlateListItemConverter: SlateNodeConverterProvider = {
  ClientComponent: ListItemConverterClient,
  converter: _SlateListItemConverter,
}
