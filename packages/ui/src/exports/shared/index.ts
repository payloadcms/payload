// IMPORTANT: the shared.ts file CANNOT contain any Server Components _that import client components_.
export { Translation } from '../../elements/Translation/index.js'
export { withMergedProps } from '../../elements/withMergedProps/index.js' // cannot be within a 'use client', thus we export this from shared
export { WithServerSideProps } from '../../elements/WithServerSideProps/index.js'
export { mergeFieldStyles } from '../../fields/mergeFieldStyles.js'
export { PayloadIcon } from '../../graphics/Icon/index.js'
export { PayloadLogo } from '../../graphics/Logo/index.js'
export { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
export { requests } from '../../utilities/api.js'
export { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
export { formatDate } from '../../utilities/formatDocTitle/formatDateTitle.js'
export {
  type EntityToGroup,
  groupNavItems,
  type NavGroupType,
} from '../../utilities/groupNavItems.js'
export { sanitizeID } from '../../utilities/sanitizeID.js'
