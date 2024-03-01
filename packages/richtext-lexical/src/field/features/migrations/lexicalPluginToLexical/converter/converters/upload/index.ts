import type { LexicalPluginNodeConverterProvider } from '../../types'

import { UploadConverterClient } from './client'
import { _UploadConverter } from './converter'

export const UploadConverter: LexicalPluginNodeConverterProvider = {
  ClientComponent: UploadConverterClient,
  converter: _UploadConverter,
}
