export const filterOutUploadFields = fields => {
  // List of reserved upload field names
  const baseUploadFieldNames = ['file', 'mimeType', 'thumbnailURL', 'width', 'height', 'filesize', 'filename', 'url', 'focalX', 'focalY', 'sizes'];
  return fields.filter(field => !baseUploadFieldNames.includes('name' in field && field.name));
};
//# sourceMappingURL=filterOutUploadFields.js.map