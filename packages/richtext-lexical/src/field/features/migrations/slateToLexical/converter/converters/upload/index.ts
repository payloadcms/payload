import type { SlateNodeConverterProvider } from '../../types'

import { UploadConverterClient } from './client'
import { _SlateUploadConverter } from './converter'

export const SlateUploadConverter: SlateNodeConverterProvider = {
  ClientComponent: UploadConverterClient,
  converter: _SlateUploadConverter,
}
