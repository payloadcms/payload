import type { SlateNodeConverterProvider } from '../../types.js'

import { UploadConverterClient } from './client.js'
import { _SlateUploadConverter } from './converter.js'

export const SlateUploadConverter: SlateNodeConverterProvider = {
  ClientFeature: UploadConverterClient,
  converter: _SlateUploadConverter,
}
