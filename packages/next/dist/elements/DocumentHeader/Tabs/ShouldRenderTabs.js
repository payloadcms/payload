'use client';

import { useDocumentInfo } from '@payloadcms/ui';
export const ShouldRenderTabs = t0 => {
  const {
    children
  } = t0;
  const {
    id: idFromContext,
    collectionSlug,
    globalSlug
  } = useDocumentInfo();
  const id = idFromContext !== "create" ? idFromContext : null;
  if (collectionSlug && id || globalSlug) {
    return children;
  }
  return null;
};
//# sourceMappingURL=ShouldRenderTabs.js.map