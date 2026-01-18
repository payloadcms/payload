export function getDocumentViewInfo(segments) {
  const [tabSegment, versionSegment] = segments;
  if (versionSegment) {
    if (tabSegment === 'versions') {
      return {
        documentSubViewType: 'version',
        viewType: 'version'
      };
    }
  } else {
    if (tabSegment === 'versions') {
      return {
        documentSubViewType: 'versions',
        viewType: 'document'
      };
    } else if (tabSegment === 'api') {
      return {
        documentSubViewType: 'api',
        viewType: 'document'
      };
    }
  }
  return {
    documentSubViewType: 'default',
    viewType: 'document'
  };
}
//# sourceMappingURL=getDocumentViewInfo.js.map