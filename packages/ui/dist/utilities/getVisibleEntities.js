function isHidden(hidden, user) {
  if (typeof hidden === 'function') {
    try {
      return hidden({
        user
      });
    } catch {
      return true;
    }
  }
  return !!hidden;
}
export function getVisibleEntities({
  req
}) {
  return {
    collections: req.payload.config.collections.map(({
      slug,
      admin: {
        hidden
      }
    }) => !isHidden(hidden, req.user) ? slug : null).filter(Boolean),
    globals: req.payload.config.globals.map(({
      slug,
      admin: {
        hidden
      }
    }) => !isHidden(hidden, req.user) ? slug : null).filter(Boolean)
  };
}
//# sourceMappingURL=getVisibleEntities.js.map