import { isPathMatchingRoute } from './isPathMatchingRoute.js';
export const getCustomViewByRoute = ({
  config,
  currentRoute: currentRouteWithAdmin
}) => {
  const {
    admin: {
      components: {
        views
      }
    },
    routes: {
      admin: adminRoute
    }
  } = config;
  let viewKey;
  const currentRoute = adminRoute === '/' ? currentRouteWithAdmin : currentRouteWithAdmin.replace(adminRoute, '');
  const foundViewConfig = views && typeof views === 'object' && Object.entries(views).find(([key, view]) => {
    const isMatching = isPathMatchingRoute({
      currentRoute,
      exact: view.exact,
      path: view.path,
      sensitive: view.sensitive,
      strict: view.strict
    });
    if (isMatching) {
      viewKey = key;
    }
    return isMatching;
  })?.[1] || undefined;
  if (!foundViewConfig) {
    return {
      view: {
        Component: null
      },
      viewConfig: null,
      viewKey: null
    };
  }
  return {
    view: {
      payloadComponent: foundViewConfig.Component
    },
    viewConfig: foundViewConfig,
    viewKey
  };
};
//# sourceMappingURL=getCustomViewByRoute.js.map