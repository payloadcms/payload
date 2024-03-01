import type { SlateNodeConverterProvider } from '../../types'

import { LinkConverterClient } from './client'
import { _SlateLinkConverter } from './converter'

export const SlateLinkConverter: SlateNodeConverterProvider = {
  ClientComponent: LinkConverterClient,
  converter: _SlateLinkConverter,
}
