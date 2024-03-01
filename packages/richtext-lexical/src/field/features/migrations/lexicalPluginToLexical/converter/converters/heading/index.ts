import type { LexicalPluginNodeConverterProvider } from '../../types'

import { HeadingConverterClient } from './client'
import { _HeadingConverter } from './converter'

export const HeadingConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: HeadingConverterClient,
  converter: _HeadingConverter,
}
