import { jsx as _jsx } from "react/jsx-runtime";
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
import { getPreferences } from '../../../../utilities/getPreferences.js';
import { ModularDashboardClient } from './index.client.js';
export async function ModularDashboard(props) {
  const {
    defaultLayout = [],
    widgets = []
  } = props.payload.config.admin.dashboard || {};
  const {
    importMap
  } = props.payload;
  const {
    user
  } = props;
  const {
    req
  } = props.initPageResult;
  const {
    i18n
  } = req;
  const layout = (await getItemsFromPreferences(props.payload, user)) ?? (await getItemsFromConfig(defaultLayout, req, widgets));
  const serverLayout = layout.map(layoutItem => {
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
  // Resolve function labels to static labels for client components
  const clientWidgets = widgets.map(widget => {
    const {
      ComponentPath: _,
      label,
      ...rest
    } = widget;
    return {
      ...rest,
      label: typeof label === 'function' ? label({
        i18n,
        t: i18n.t
      }) : label
    };
  });
  return /*#__PURE__*/_jsx("div", {
    children: /*#__PURE__*/_jsx(ModularDashboardClient, {
      clientLayout: serverLayout,
      widgets: clientWidgets
    })
  });
}
async function getItemsFromPreferences(payload, user) {
  const savedPreferences = await getPreferences('dashboard-layout', payload, user.id, user.collection);
  if (!savedPreferences?.value || typeof savedPreferences.value !== 'object' || !('layouts' in savedPreferences.value)) {
    return null;
  }
  return savedPreferences.value.layouts;
}
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
    const widget = widgets.find(widget => widget.slug === widgetInstance.widgetSlug);
    return {
      id: `${widgetInstance.widgetSlug}-${index}`,
      maxWidth: widget?.maxWidth ?? 'full',
      minWidth: widget?.minWidth ?? 'x-small',
      width: widgetInstance.width || 'x-small'
    };
  });
}
//# sourceMappingURL=index.js.map