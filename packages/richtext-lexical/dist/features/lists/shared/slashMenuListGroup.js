export function slashMenuListGroupWithItems(items) {
  return {
    items,
    key: 'lists',
    label: ({
      i18n
    }) => {
      return i18n.t('lexical:general:slashMenuListGroupLabel');
    }
  };
}
//# sourceMappingURL=slashMenuListGroup.js.map