import type { SlateNodeConverterProvider } from '../../types.js'

import { HeadingConverterClient } from './client.js'
import { _SlateHeadingConverter } from './converter.js'

export const SlateHeadingConverter: SlateNodeConverterProvider = {
  ClientConverter: HeadingConverterClient,
  converter: _SlateHeadingConverter,
}
