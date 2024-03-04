import { GenerateEditViewMetadata, getMetaBySegment } from './getMetaBySegment'

export const generateDocumentMetadata: GenerateEditViewMetadata = async (args) =>
  getMetaBySegment(args)
