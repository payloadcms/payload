// IMPORTANT: the shared.ts file CANNOT contain any Server Components _that import client components_.
export { filterFields } from '../../elements/TableColumns/filterFields.js'
export { getInitialColumns } from '../../elements/TableColumns/getInitialColumns.js'
export { Translation } from '../../elements/Translation/index.js'
export { withMergedProps } from '../../elements/withMergedProps/index.js' // cannot be within a 'use client', thus we export this from shared
export { WithServerSideProps } from '../../elements/WithServerSideProps/index.js'
export { mergeFieldStyles } from '../../fields/mergeFieldStyles.js'
export { reduceToSerializableFields } from '../../forms/Form/reduceToSerializableFields.js'
export { PayloadIcon } from '../../graphics/Icon/index.js'
export { PayloadLogo } from '../../graphics/Logo/index.js'
export { abortAndIgnore } from '../../utilities/abortAndIgnore.js'
export { requests } from '../../utilities/api.js'
export { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
export { formatAdminURL } from '../../utilities/formatAdminURL.js'
export { formatDate } from '../../utilities/formatDate.js'
export { formatDocTitle } from '../../utilities/formatDocTitle.js'
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
export { mergeListSearchAndWhere } from '../../utilities/mergeListSearchAndWhere.js'
export { sanitizeID } from '../../utilities/sanitizeID.js'
