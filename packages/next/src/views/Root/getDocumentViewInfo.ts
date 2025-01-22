import type { DocumentSubViewTypes, ViewTypes } from 'payload'

export function getDocumentViewInfo(segments: string[]): {
  documentSubViewType?: DocumentSubViewTypes
  viewType: ViewTypes
} {
  const [tabSegment, versionSegment] = segments

  if (versionSegment) {
    if (tabSegment === 'versions') {
      return {
        documentSubViewType: 'version',
        viewType: 'version',
      }
    }
  } else {
    if (tabSegment === 'versions') {
      return {
        documentSubViewType: 'versions',
        viewType: 'document',
      }
    } else if (tabSegment === 'preview') {
      return {
        documentSubViewType: 'livePreview',
        viewType: 'document',
      }
    } else if (tabSegment === 'api') {
      return {
        documentSubViewType: 'api',
        viewType: 'document',
      }
    }
  }

  return {
    documentSubViewType: 'default',
    viewType: 'document',
  }
}
