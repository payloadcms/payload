import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
export const handleAuthRedirect = ({
  config,
  route,
  searchParams,
  user
}) => {
  const {
    admin: {
      routes: {
        login: loginRouteFromConfig,
        unauthorized: unauthorizedRoute
      }
    },
    routes: {
      admin: adminRoute
    }
  } = config;
  if (searchParams && 'redirect' in searchParams) {
    delete searchParams.redirect;
  }
  const redirectRoute = (route !== adminRoute ? route : '') + (Object.keys(searchParams ?? {}).length > 0 ? `${qs.stringify(searchParams, {
    addQueryPrefix: true
  })}` : '');
  const redirectTo = formatAdminURL({
    adminRoute,
    path: user ? unauthorizedRoute : loginRouteFromConfig
  });
  const parsedLoginRouteSearchParams = qs.parse(redirectTo.split('?')[1] ?? '');
  const searchParamsWithRedirect = `${qs.stringify({
    ...parsedLoginRouteSearchParams,
    ...(redirectRoute ? {
      redirect: redirectRoute
    } : {})
  }, {
    addQueryPrefix: true
  })}`;
  return `${redirectTo.split('?', 1)[0]}${searchParamsWithRedirect}`;
};
//# sourceMappingURL=handleAuthRedirect.js.map