import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { getMetaBySegment } from './getMetaBySegment.js'

export const generateDocumentMetadata: GenerateEditViewMetadata = async (args) =>
  getMetaBySegment(args)
