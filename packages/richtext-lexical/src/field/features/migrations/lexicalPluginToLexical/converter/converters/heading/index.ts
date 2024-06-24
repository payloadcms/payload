import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { HeadingConverterClient } from './client.js'
import { _HeadingConverter } from './converter.js'

export const HeadingConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: HeadingConverterClient,
  converter: _HeadingConverter,
}
