import type { LexicalPluginNodeConverterProvider } from '../../types.js'

import { UploadConverterClient } from './client.js'
import { _UploadConverter } from './converter.js'

export const UploadConverter: LexicalPluginNodeConverterProvider = {
  ClientConverter: UploadConverterClient,
  converter: _UploadConverter,
}
