export const getCustomDocumentViewByKey = (views, customViewKey) => {
  return typeof views?.edit?.[customViewKey] === 'object' && 'Component' in views.edit[customViewKey] ? views?.edit?.[customViewKey].Component : null;
};
//# sourceMappingURL=getCustomDocumentViewByKey.js.map