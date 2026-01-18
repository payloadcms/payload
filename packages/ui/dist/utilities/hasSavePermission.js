export const hasSavePermission = args => {
  const {
    collectionSlug,
    docPermissions,
    globalSlug,
    isEditing
  } = args;
  if (collectionSlug) {
    return Boolean(isEditing && docPermissions?.update || !isEditing && docPermissions?.create);
  }
  if (globalSlug) {
    return Boolean(docPermissions?.update);
  }
  return false;
};
//# sourceMappingURL=hasSavePermission.js.map