export { Translation } from '../../elements/Translation/index.js'
export { withMergedProps } from '../../elements/withMergedProps/index.js' // cannot be within a 'use client', thus we export this from shared
export { WithServerSideProps } from '../../elements/WithServerSideProps/index.js'
export { mergeFieldStyles } from '../../fields/mergeFieldStyles.js'
export { reduceToSerializableFields } from '../../forms/Form/reduceToSerializableFields.js'
export { PayloadIcon } from '../../graphics/Icon/index.js'
export { PayloadLogo } from '../../graphics/Logo/index.js'
// IMPORTANT: the shared.ts file CANNOT contain any Server Components _that import client components_.
export { filterFields } from '../../providers/TableColumns/filterFields.js'
export { getInitialColumns } from '../../providers/TableColumns/getInitialColumns.js'
export { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
export { requests } from '../../utilities/api.js'
export { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
export { formatAdminURL } from '../../utilities/formatAdminURL.js'
export { formatDate } from '../../utilities/formatDocTitle/formatDateTitle.js'
export { formatDocTitle } from '../../utilities/formatDocTitle/index.js'
export {
  type EntityToGroup,
  EntityType,
  groupNavItems,
  type NavGroupType,
} from '../../utilities/groupNavItems.js'
export { handleBackToDashboard } from '../../utilities/handleBackToDashboard.js'
export { handleGoBack } from '../../utilities/handleGoBack.js'
export { handleTakeOver } from '../../utilities/handleTakeOver.js'
export { hasSavePermission } from '../../utilities/hasSavePermission.js'
export { isClientUserObject } from '../../utilities/isClientUserObject.js'
export { isEditing } from '../../utilities/isEditing.js'
export { sanitizeID } from '../../utilities/sanitizeID.js'
/**
 * @deprecated
 * The `mergeListSearchAndWhere` function is deprecated.
 * Import this from `payload/shared` instead.
 */
export { mergeListSearchAndWhere } from 'payload/shared'
