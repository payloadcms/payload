export { AccountView, CreateFirstUserView, DashboardView } from '../views/adapter.js'
export {
  type DashboardViewClientProps,
  type DashboardViewServerProps,
  type DashboardViewServerPropsOnly,
  DefaultDashboard,
} from '../views/Dashboard/Default/index.js'

export { ListView, renderListView, type RenderListViewArgs } from '../views/List/index.js'
export { LoginView } from '../views/Login/index.js'
export { NotFoundPage } from '../views/NotFound/index.js'

export { type GenerateViewMetadata, RootPage } from '../views/Root/index.js'
export { generatePageMetadata } from '../views/Root/metadata.js'
