import type { LexicalPluginNodeConverterProvider } from '../../types'

import { LinkConverterClient } from './client'
import { _LinkConverter } from './converter'

export const LinkConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: LinkConverterClient,
  converter: _LinkConverter,
}
