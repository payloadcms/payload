// IMPORTANT: the shared.ts file CANNOT contain any Server Components _that import client components_.
export { Translation } from '../../shared/elements/Translation/index.js'
export { withMergedProps } from '../../shared/elements/withMergedProps/index.js' // cannot be within a 'use client', thus we export this from shared
export { WithServerSideProps } from '../../shared/elements/WithServerSideProps/index.js'
export { mergeFieldStyles } from '../../shared/fields/mergeFieldStyles.js'
export { reduceToSerializableFields } from '../../shared/forms/Form/reduceToSerializableFields.js'
export { PayloadIcon } from '../../shared/graphics/Icon/index.js'
export { PayloadLogo } from '../../shared/graphics/Logo/index.js'
export {
  getViewportContent,
  getViewportMeta,
  isIPhoneUserAgent,
} from '../../shared/layouts/Root/viewport.js'
export { filterFields } from '../../shared/providers/TableColumns/buildColumnState/filterFields.js'
export { getInitialColumns } from '../../shared/providers/TableColumns/getInitialColumns.js'
export { abortAndIgnore, handleAbortRef } from '../../shared/utilities/abortAndIgnore.js'
export { requests } from '../../shared/utilities/api.js'
export { findLocaleFromCode } from '../../shared/utilities/findLocaleFromCode.js'
export { formatDate } from '../../shared/utilities/formatDocTitle/formatDateTitle.js'
export { formatDocTitle } from '../../shared/utilities/formatDocTitle/index.js'
export { getGlobalData } from '../../shared/utilities/getGlobalData.js'
export { getNavGroups } from '../../shared/utilities/getNavGroups.js'
export { getVisibleEntities } from '../../shared/utilities/getVisibleEntities.js'
export {
  type EntityToGroup,
  groupNavItems,
  type NavGroupType,
} from '../../shared/utilities/groupNavItems.js'
export { handleBackToDashboard } from '../../shared/utilities/handleBackToDashboard.js'
export { handleGoBack } from '../../shared/utilities/handleGoBack.js'
export { handleTakeOver } from '../../shared/utilities/handleTakeOver.js'
export { hasSavePermission } from '../../shared/utilities/hasSavePermission.js'
export { isClientUserObject } from '../../shared/utilities/isClientUserObject.js'
export { isEditing } from '../../shared/utilities/isEditing.js'
export { sanitizeID } from '../../shared/utilities/sanitizeID.js'
export { traverseForLocalizedFields } from '../../shared/utilities/traverseForLocalizedFields.js'
