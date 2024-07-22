import type { SlateNodeConverterProvider } from '../../types.js'

import { LinkConverterClient } from './client.js'
import { _SlateLinkConverter } from './converter.js'

export const SlateLinkConverter: SlateNodeConverterProvider = {
  ClientConverter: LinkConverterClient,
  converter: _SlateLinkConverter,
}
