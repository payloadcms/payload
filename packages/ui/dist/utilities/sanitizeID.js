export function sanitizeID(id) {
  if (id === undefined) {
    return id;
  }
  if (typeof id === 'number') {
    return id;
  }
  return decodeURIComponent(id);
}
//# sourceMappingURL=sanitizeID.js.map