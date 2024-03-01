import type { SlateNodeConverterProvider } from '../../types'

import { HeadingConverterClient } from './client'
import { _SlateHeadingConverter } from './converter'

export const SlateHeadingConverter: SlateNodeConverterProvider = {
  ClientComponent: HeadingConverterClient,
  converter: _SlateHeadingConverter,
}
