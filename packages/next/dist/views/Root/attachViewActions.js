export function getViewActions({
  editConfig,
  viewKey
}) {
  if (editConfig && viewKey in editConfig && 'actions' in editConfig[viewKey]) {
    return editConfig[viewKey].actions ?? [];
  }
  return [];
}
export function getSubViewActions({
  collectionOrGlobal,
  viewKeyArg
}) {
  if (collectionOrGlobal?.admin?.components?.views?.edit) {
    let viewKey = viewKeyArg || 'default';
    if ('root' in collectionOrGlobal.admin.components.views.edit) {
      viewKey = 'root';
    }
    const actions = getViewActions({
      editConfig: collectionOrGlobal.admin?.components?.views?.edit,
      viewKey
    });
    return actions;
  }
  return [];
}
//# sourceMappingURL=attachViewActions.js.map