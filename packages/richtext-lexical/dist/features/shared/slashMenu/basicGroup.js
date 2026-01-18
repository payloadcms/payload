export function slashMenuBasicGroupWithItems(items) {
  return {
    items,
    key: 'basic',
    label: ({
      i18n
    }) => {
      return i18n.t('lexical:general:slashMenuBasicGroupLabel');
    }
  };
}
//# sourceMappingURL=basicGroup.js.map