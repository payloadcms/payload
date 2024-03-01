import type { LexicalPluginNodeConverterProvider } from '../../types'

import { UnknownConverterClient } from './client'
import { _UnknownConverter } from './converter'

export const UnknownConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: UnknownConverterClient,
  converter: _UnknownConverter,
}
