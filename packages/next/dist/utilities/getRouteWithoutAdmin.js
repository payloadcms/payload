export const getRouteWithoutAdmin = ({
  adminRoute,
  route
}) => {
  return adminRoute && adminRoute !== '/' ? route.replace(adminRoute, '') : route;
};
//# sourceMappingURL=getRouteWithoutAdmin.js.map