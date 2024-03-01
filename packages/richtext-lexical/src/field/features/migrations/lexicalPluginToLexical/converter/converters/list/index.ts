import type { LexicalPluginNodeConverterProvider } from '../../types'

import { ListConverterClient } from './client'
import { _ListConverter } from './converter'

export const ListConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: ListConverterClient,
  converter: _ListConverter,
}
