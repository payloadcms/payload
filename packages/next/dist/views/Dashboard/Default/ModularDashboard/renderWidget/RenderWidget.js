'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { ShimmerEffect, useServerFunctions } from '@payloadcms/ui';
import React, { useCallback, useEffect, useRef } from 'react';
/**
 * Utility to render a widget on-demand on the client.
 */
export const RenderWidget = t0 => {
  const $ = _c(9);
  const {
    widgetId
  } = t0;
  const [Component, setComponent] = React.useState(null);
  const {
    serverFunction
  } = useServerFunctions();
  let t1;
  if ($[0] !== serverFunction || $[1] !== widgetId) {
    t1 = () => {
      const render = async function render() {
        ;
        try {
          const widgetSlug = widgetId.slice(0, widgetId.lastIndexOf("-"));
          const result = await serverFunction({
            name: "render-widget",
            args: {
              widgetSlug
            }
          });
          setComponent(result.component);
        } catch (t2) {
          setComponent(React.createElement("div", {
            style: {
              background: "var(--theme-error-50)",
              border: "1px solid var(--theme-error-200)",
              borderRadius: "4px",
              color: "var(--theme-error-text)",
              padding: "20px",
              textAlign: "center"
            }
          }, "Failed to load widget. Please try again later."));
        }
      };
      render();
    };
    $[0] = serverFunction;
    $[1] = widgetId;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const renderWidget = t1;
  const mounted = useRef(false);
  let t2;
  let t3;
  if ($[3] !== renderWidget) {
    t2 = () => {
      if (mounted.current) {
        return;
      }
      mounted.current = true;
      renderWidget();
    };
    t3 = [renderWidget];
    $[3] = renderWidget;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  useEffect(t2, t3);
  if (!Component) {
    let t4;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      t4 = _jsx(ShimmerEffect, {
        height: "100%"
      });
      $[6] = t4;
    } else {
      t4 = $[6];
    }
    return t4;
  }
  let t4;
  if ($[7] !== Component) {
    t4 = _jsx(_Fragment, {
      children: Component
    });
    $[7] = Component;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
};
//# sourceMappingURL=RenderWidget.js.map