import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import React from 'react';
/**
 * Server function to render a widget on-demand.
 * Similar to render-field but specifically for dashboard widgets.
 */
export const renderWidgetHandler = ({
  req,
  /* widgetData, */widgetSlug
}) => {
  if (!req.user) {
    throw new Error('Unauthorized');
  }
  const {
    widgets
  } = req.payload.config.admin.dashboard;
  const {
    importMap
  } = req.payload;
  // Find the widget configuration
  const widgetConfig = widgets.find(widget => widget.slug === widgetSlug);
  if (!widgetConfig) {
    return {
      component: React.createElement('div', {
        style: {
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '4px',
          color: 'var(--theme-text)',
          padding: '20px',
          textAlign: 'center'
        }
      }, `Widget "${widgetSlug}" not found`)
    };
  }
  try {
    // Create server props for the widget
    const serverProps = {
      req,
      // TODO: widgetData: widgetData || {},
      widgetSlug
    };
    // Render the widget server component
    const component = RenderServerComponent({
      Component: widgetConfig.ComponentPath,
      importMap,
      serverProps
    });
    return {
      component
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    req.payload.logger.error({
      err: error,
      msg: `Error rendering widget "${widgetSlug}": ${errorMessage}`
    });
    return {
      component: React.createElement('div', {
        style: {
          background: 'var(--theme-error-50)',
          border: '1px solid var(--theme-error-200)',
          borderRadius: '4px',
          color: 'var(--theme-error-text)',
          padding: '20px',
          textAlign: 'center'
        }
      }, 'Error loading widget')
    };
  }
};
//# sourceMappingURL=renderWidgetServerFn.js.map