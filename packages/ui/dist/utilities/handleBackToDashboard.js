import { formatAdminURL } from 'payload/shared';
export const handleBackToDashboard = ({
  adminRoute,
  router,
  serverURL
}) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: '',
    serverURL
  });
  router.push(redirectRoute);
};
//# sourceMappingURL=handleBackToDashboard.js.map