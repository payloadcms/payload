import { adminViews } from '../views/adapter.js'

export { adminViews }
export const AccountView = adminViews.account
export const CreateFirstUserView = adminViews.createFirstUser
export const DashboardView = adminViews.dashboard

export {
  type DashboardViewClientProps,
  type DashboardViewServerProps,
  type DashboardViewServerPropsOnly,
  DefaultDashboard,
} from '../views/Dashboard/Default/index.js'

export { ListView, renderListView, type RenderListViewArgs } from '../views/List/index.js'
export { LoginView } from '../views/Login/index.js'
export { NotFoundPage } from '../views/NotFound.js'

export { type GenerateViewMetadata, RootPage } from '../views/Root/index.js'
export { generatePageMetadata } from '../views/Root/metadata.js'
