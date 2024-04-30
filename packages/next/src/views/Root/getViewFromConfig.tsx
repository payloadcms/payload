import type { SanitizedConfig } from 'payload/config'
import type { AdminViewComponent } from 'payload/types'

import type { initPage } from '../../utilities/initPage.js'

import { Account } from '../Account/index.js'
import { CreateFirstUserView } from '../CreateFirstUser/index.js'
import { Dashboard } from '../Dashboard/index.js'
import { Document as DocumentView } from '../Document/index.js'
import { ForgotPasswordView, forgotPasswordBaseClass } from '../ForgotPassword/index.js'
import { ListView } from '../List/index.js'
import { LoginView, loginBaseClass } from '../Login/index.js'
import { LogoutInactivity, LogoutView } from '../Logout/index.js'
import { ResetPassword, resetPasswordBaseClass } from '../ResetPassword/index.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { Verify, verifyBaseClass } from '../Verify/index.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

const baseClasses = {
  forgot: forgotPasswordBaseClass,
  login: loginBaseClass,
  reset: resetPasswordBaseClass,
  verify: verifyBaseClass,
}

const oneSegmentViews = {
  'create-first-user': CreateFirstUserView,
  forgot: ForgotPasswordView,
  login: LoginView,
  logout: LogoutView,
  'logout-inactivity': LogoutInactivity,
  unauthorized: UnauthorizedView,
}

export const getViewFromConfig = ({
  adminRoute,
  config,
  currentRoute,
  searchParams,
  segments,
}: {
  adminRoute
  config: SanitizedConfig
  currentRoute: string
  searchParams: {
    [key: string]: string | string[]
  }
  segments: string[]
}): {
  DefaultView: AdminViewComponent
  initPageOptions: Parameters<typeof initPage>[0]
  templateClassName: string
  templateType: 'default' | 'minimal' | 'none'
} => {
  let ViewToRender: AdminViewComponent = null
  let templateClassName: string
  let templateType: 'default' | 'minimal' | 'none' = 'minimal'

  const initPageOptions: Parameters<typeof initPage>[0] = {
    config,
    route: currentRoute,
    searchParams,
  }

  const [segmentOne, segmentTwo] = segments

  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'

  switch (segments.length) {
    case 0: {
      if (currentRoute === adminRoute) {
        ViewToRender = Dashboard
        templateClassName = 'dashboard'
        templateType = 'default'
        initPageOptions.redirectUnauthenticatedUser = true
      }
      break
    }
    case 1: {
      if (oneSegmentViews[segmentOne] && segmentOne !== 'account') {
        // --> /create-first-user
        // --> /forgot
        // --> /login
        // --> /logout
        // --> /logout-inactivity
        // --> /unauthorized
        ViewToRender = oneSegmentViews[segmentOne]
        templateClassName = baseClasses[segmentOne]
        templateType = 'minimal'
      } else if (segmentOne === 'account') {
        // --> /account
        initPageOptions.redirectUnauthenticatedUser = true
        ViewToRender = Account
        templateClassName = 'account'
        templateType = 'default'
      }
      break
    }
    case 2: {
      if (segmentOne === 'reset') {
        // --> /reset/:token
        ViewToRender = ResetPassword
        templateClassName = baseClasses[segmentTwo]
        templateType = 'minimal'
      }

      if (isCollection) {
        // --> /collections/:collectionSlug
        initPageOptions.redirectUnauthenticatedUser = true
        ViewToRender = ListView
        templateClassName = `${segmentTwo}-list`
        templateType = 'default'
      } else if (isGlobal) {
        // --> /globals/:globalSlug
        initPageOptions.redirectUnauthenticatedUser = true
        ViewToRender = DocumentView
        templateClassName = 'global-edit'
        templateType = 'default'
      }
      break
    }
    default:
      if (segmentTwo === 'verify') {
        // --> /:collectionSlug/verify/:token
        ViewToRender = Verify
        templateClassName = 'verify'
        templateType = 'minimal'
      } else if (isCollection) {
        // Custom Views
        // --> /collections/:collectionSlug/:id
        // --> /collections/:collectionSlug/:id/preview
        // --> /collections/:collectionSlug/:id/versions
        // --> /collections/:collectionSlug/:id/versions/:versionId
        // --> /collections/:collectionSlug/:id/api
        initPageOptions.redirectUnauthenticatedUser = true
        ViewToRender = DocumentView
        templateClassName = `collection-default-edit`
        templateType = 'default'
      } else if (isGlobal) {
        // Custom Views
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/versions/:versionId
        // --> /globals/:globalSlug/api
        initPageOptions.redirectUnauthenticatedUser = true
        ViewToRender = DocumentView
        templateClassName = `global-edit`
        templateType = 'default'
      }
      break
  }

  if (!ViewToRender) {
    const result = getCustomViewByRoute({ config, currentRoute })
    templateType = result?.templateType
    templateClassName = result?.templateClassname
    ViewToRender = result?.ViewToRender
  }

  return {
    DefaultView: ViewToRender,
    initPageOptions,
    templateClassName,
    templateType,
  }
}
