import { formatAdminURL } from 'payload/shared';
export const handleGoBack = ({
  adminRoute,
  collectionSlug,
  router,
  serverURL
}) => {
  const redirectRoute = formatAdminURL({
    adminRoute,
    path: collectionSlug ? `/collections/${collectionSlug}` : '/'
  });
  router.push(redirectRoute);
};
//# sourceMappingURL=handleGoBack.js.map