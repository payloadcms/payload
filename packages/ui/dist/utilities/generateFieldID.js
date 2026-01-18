export const generateFieldID = (path, editDepth, uuid) => {
  if (!path) {
    return undefined;
  }
  return `field-${path.replace(/\./g, '__')}${editDepth > 1 ? `-${editDepth}` : ''}${uuid ? `-${uuid}` : ''}`;
};
//# sourceMappingURL=generateFieldID.js.map