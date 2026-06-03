import type { GenerateEditViewMetadata } from './getMetaBySegment.js'

import { getMetaBySegment } from './getMetaBySegment.js'

export const generateDocumentViewMetadata: GenerateEditViewMetadata = async (args) =>
  getMetaBySegment(args)
