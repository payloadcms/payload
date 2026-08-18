// Modules exported here are not part of the public API.
// They may change without notice or a major version bump.

export { FieldDiffContainer } from '../../elements/FieldDiffContainer/index.js'
export { FieldDiffLabel } from '../../elements/FieldDiffLabel/index.js'
export { HierarchyButton } from '../../elements/Hierarchy/DocHeaderButton/index.server.js'
export { HierarchyField } from '../../elements/Hierarchy/Field/index.server.js'
export { HierarchySidebarTabServer } from '../../elements/Hierarchy/Tree/HierarchySidebarTab.server.js'
export {
  escapeDiffHTML,
  getHTMLDiffComponents,
  unescapeDiffHTML,
} from '../../elements/HTMLDiff/index.js'
export { getNavPrefs } from '../../elements/Nav/getNavPrefs.js'
export { renderTabHandler } from '../../elements/Nav/SidebarTabs/renderTabServerFn.js'
export type {
  RenderTabServerFnArgs,
  RenderTabServerFnReturnType,
} from '../../elements/Nav/SidebarTabs/renderTabServerFn.js'
export { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
export { renderField } from '../../forms/fieldSchemasToFormState/renderField.js'
export { _internal_renderFieldHandler } from '../../forms/fieldSchemasToFormState/serverFunctions/renderFieldServerFn.js'
export { metadata, RootLayout } from '../../layouts/Root/index.js'
export { buildFormState, buildFormStateHandler } from '../../utilities/buildFormState.js'
export { buildTableStateHandler } from '../../utilities/buildTableState.js'
export { copyDataFromLocaleHandler } from '../../utilities/copyDataFromLocale.js'
export { formatMetadata } from '../../utilities/formatMetadata.js'
export { getColumns } from '../../utilities/getColumns.js'
export { getPreferences } from '../../utilities/getPreferences.js'
export { handleLivePreview } from '../../utilities/handleLivePreview.js'
export { handlePreview } from '../../utilities/handlePreview.js'
export { createServerFunctionHandler } from '../../utilities/handleServerFunctions.js'
export { addRecentlyViewedItem, recentlyViewedMaxItems } from '../../utilities/recentlyViewed.js'
export { renderFilters, renderTable } from '../../utilities/renderTable.js'
export { resolveFilterOptions } from '../../utilities/resolveFilterOptions.js'
export { sharedServerFunctions } from '../../utilities/serverFunctionRegistry.js'
export { upsertPreferences } from '../../utilities/upsertPreferences.js'
export {
  generateAPIViewMetadata,
  type GenerateEditViewMetadata,
} from '../../views/API/generateAPIViewMetadata.js'
export { generateCollectionTrashMetadata } from '../../views/CollectionTrash/generateCollectionTrashMetadata.js'
export { CreateFirstUserView } from '../../views/CreateFirstUser/index.js'
export { DefaultDashboard } from '../../views/Dashboard/index.js'
export { generateEditViewMetadata } from '../../views/Document/generateEditViewMetadata.js'
export {
  getMetaBySegment,
  type GetMetaBySegmentArgs,
} from '../../views/Document/getMetaBySegment.js'
export { renderDocumentHandler } from '../../views/Document/handleServerFunction.js'
export {
  renderDocumentSlots,
  renderDocumentSlotsHandler,
} from '../../views/Document/renderDocumentSlots.js'
export { generateListViewMetadata } from '../../views/List/generateListViewMetadata.js'
export { renderListHandler } from '../../views/List/handleServerFunction.js'
export { renderNotFoundPage, type RenderNotFoundPageArgs } from '../../views/NotFound/page.js'
export { defaultAdminViews } from '../../views/Root/adminViews.js'
export { generateCustomViewMetadata } from '../../views/Root/generateCustomViewMetadata.js'
export {
  generatePageMetadata,
  type GeneratePageMetadataArgs,
} from '../../views/Root/generatePageMetadata.js'
export { renderRoot, type RenderRootArgs } from '../../views/Root/index.js'
export { generateVersionViewMetadata } from '../../views/Version/generateVersionViewMetadata.js'
export { generateVersionsViewMetadata } from '../../views/Versions/generateVersionsViewMetadata.js'
export { CollectionQueryWidget } from '../../widgets/CollectionQuery/index.js'
export { RecentlyViewedWidget } from '../../widgets/RecentlyViewed/index.js'
