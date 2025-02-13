import type { Config } from 'payload'

export const slugSingularLabel = 'Post'

export const slugPluralLabel = 'Posts'

export const customViewPath = '/custom-view'

export const customNestedViewPath = `${customViewPath}/nested-view`

export const publicCustomViewPath = '/public-custom-view'

export const protectedCustomNestedViewPath = `${publicCustomViewPath}/protected-nested-view`

export const customParamViewPathBase = '/custom-param'

export const customParamViewPath = `${customParamViewPathBase}/:id`

export const customViewTitle = 'Custom View'

export const customParamViewTitle = 'Custom Param View'

export const customNestedViewTitle = 'Custom Nested View'

export const customEditLabel = 'Custom Edit Label'

export const customTabLabel = 'Custom Tab Label'

export const customTabViewPath = '/custom-tab-component'

export const customTabViewTitle = 'Custom View With Tab Component'

export const customTabLabelViewTitle = 'Custom Tab Label View'

export const customTabViewComponentTitle = 'Custom View With Tab Component'

export const customNestedTabViewPath = `${customTabViewPath}/nested-view`

export const customCollectionMetaTitle = 'Custom Meta Title'

export const customRootViewMetaTitle = 'Custom Root View Meta Title'

export const customDefaultTabMetaTitle = 'Custom Default Tab Meta Title'

export const customVersionsTabMetaTitle = 'Custom Versions Tab Meta Title'

export const customTabAdminDescription = 'Custom Tab Admin Description'

export const customViewMetaTitle = 'Custom Tab Meta Title'

export const customNestedTabViewTitle = 'Custom Nested Tab View'

export const customCollectionParamViewPathBase = '/custom-param'

export const customCollectionParamViewPath = `${customCollectionParamViewPathBase}/:slug`

export const customAdminRoutes: Config['admin']['routes'] = {
  inactivity: '/custom-inactivity',
  logout: '/custom-logout',
}
