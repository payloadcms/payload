import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
/**
 * Server function to get the default dashboard layout on-demand.
 * Used when resetting the dashboard to its default configuration.
 */
export const getDefaultLayoutHandler = async ({
  req
}) => {
  if (!req.user) {
    throw new Error('Unauthorized');
  }
  const {
    defaultLayout = [],
    widgets = []
  } = req.payload.config.admin.dashboard || {};
  const {
    importMap
  } = req.payload;
  const layoutItems = await getItemsFromConfig(defaultLayout, req, widgets);
  const layout = layoutItems.map(layoutItem => {
    const widgetSlug = layoutItem.id.slice(0, layoutItem.id.lastIndexOf('-'));
    return {
      component: RenderServerComponent({
        Component: widgets.find(widget => widget.slug === widgetSlug)?.ComponentPath,
        importMap,
        serverProps: {
          req,
          widgetSlug
        }
      }),
      item: layoutItem
    };
  });
  return {
    layout
  };
};
async function getItemsFromConfig(defaultLayout, req, widgets) {
  // Handle function format
  let widgetInstances;
  if (typeof defaultLayout === 'function') {
    widgetInstances = await defaultLayout({
      req
    });
  } else {
    widgetInstances = defaultLayout;
  }
  return widgetInstances.map((widgetInstance, index) => {
    const widget = widgets.find(w => w.slug === widgetInstance.widgetSlug);
    return {
      id: `${widgetInstance.widgetSlug}-${index}`,
      maxWidth: widget?.maxWidth ?? 'full',
      minWidth: widget?.minWidth ?? 'x-small',
      width: widgetInstance.width || 'x-small'
    };
  });
}
//# sourceMappingURL=getDefaultLayoutServerFn.js.map