import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
export const renderFolderViewSlots = ({
  clientProps,
  collectionConfig,
  description,
  payload,
  serverProps
}) => {
  const result = {};
  if (collectionConfig.admin.components?.afterList) {
    result.AfterFolderList = RenderServerComponent({
      clientProps: clientProps,
      Component: collectionConfig.admin.components.afterList,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  const listMenuItems = collectionConfig.admin.components?.listMenuItems;
  if (Array.isArray(listMenuItems)) {
    result.listMenuItems = [RenderServerComponent({
      clientProps,
      Component: listMenuItems,
      importMap: payload.importMap,
      serverProps
    })];
  }
  if (collectionConfig.admin.components?.afterListTable) {
    result.AfterFolderListTable = RenderServerComponent({
      clientProps: clientProps,
      Component: collectionConfig.admin.components.afterListTable,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  if (collectionConfig.admin.components?.beforeList) {
    result.BeforeFolderList = RenderServerComponent({
      clientProps: clientProps,
      Component: collectionConfig.admin.components.beforeList,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  if (collectionConfig.admin.components?.beforeListTable) {
    result.BeforeFolderListTable = RenderServerComponent({
      clientProps: clientProps,
      Component: collectionConfig.admin.components.beforeListTable,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  if (collectionConfig.admin.components?.Description) {
    result.Description = RenderServerComponent({
      clientProps: {
        collectionSlug: collectionConfig.slug,
        description
      },
      Component: collectionConfig.admin.components.Description,
      importMap: payload.importMap,
      serverProps: serverProps
    });
  }
  return result;
};
//# sourceMappingURL=renderFolderViewSlots.js.map