export const getCustomViewByKey = ({
  config,
  viewKey
}) => {
  const customViewComponent = config.admin.components?.views?.[viewKey];
  if (!customViewComponent) {
    return null;
  }
  return {
    view: {
      payloadComponent: customViewComponent.Component
    },
    viewKey
  };
};
//# sourceMappingURL=getCustomViewByKey.js.map