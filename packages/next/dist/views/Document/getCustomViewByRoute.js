import { isPathMatchingRoute } from '../Root/isPathMatchingRoute.js';
export const getCustomViewByRoute = ({
  baseRoute,
  currentRoute,
  views
}) => {
  if (typeof views?.edit === 'object') {
    let viewKey;
    const foundViewConfig = Object.entries(views.edit).find(([key, view]) => {
      if (typeof view === 'object' && 'path' in view) {
        const viewPath = `${baseRoute}${view.path}`;
        const isMatching = isPathMatchingRoute({
          currentRoute,
          exact: true,
          path: viewPath
        });
        if (isMatching) {
          viewKey = key;
        }
        return isMatching;
      }
      return false;
    })?.[1];
    if (foundViewConfig && 'Component' in foundViewConfig) {
      return {
        Component: foundViewConfig.Component,
        viewKey
      };
    }
  }
  return {
    Component: null
  };
};
//# sourceMappingURL=getCustomViewByRoute.js.map