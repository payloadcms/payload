// IMPORTANT: the shared.ts file CANNOT contain any Server Components _that import client components_.
export { WithServerSideProps } from '../../elements/WithServerSideProps/index.js'
export { withMergedProps } from '../../elements/withMergedProps/index.js' // cannot be within a 'use client', thus we export this from shared
export { PayloadIcon } from '../../graphics/Icon/index.js'
export { PayloadLogo } from '../../graphics/Logo/index.js'
export { RenderComponent } from '../../providers/ComponentMap/RenderComponent.js'
export { getComponent } from '../../providers/ComponentMap/buildComponentMap/getComponent.js'

export { getCreateMappedComponent } from '../../providers/ComponentMap/buildComponentMap/getCreateMappedComponent.js'
export { requests } from '../../utilities/api.js'
export { findLocaleFromCode } from '../../utilities/findLocaleFromCode.js'
export { formatAdminURL } from '../../utilities/formatAdminURL.js'
export { formatDate } from '../../utilities/formatDate.js'
export { formatDocTitle } from '../../utilities/formatDocTitle.js'
export { getFormState } from '../../utilities/getFormState.js'
export {
  type EntityToGroup,
  EntityType,
  type Group,
  groupNavItems,
} from '../../utilities/groupNavItems.js'
export { hasSavePermission } from '../../utilities/hasSavePermission.js'
export { isEditing } from '../../utilities/isEditing.js'

export const emptyComponent = () => null
