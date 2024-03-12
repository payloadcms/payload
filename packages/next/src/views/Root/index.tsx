import type { I18n } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type { AdminViewProps, SanitizedConfig } from 'payload/types'

import { DefaultTemplate, MinimalTemplate } from '@payloadcms/ui'
import { notFound, redirect } from 'next/navigation.js'
import React from 'react'

import { initPage } from '../../utilities/initPage.js'
import { Account } from '../Account/index.js'
import { CreateFirstUser } from '../CreateFirstUser/index.js'
import { Dashboard } from '../Dashboard/index.js'
import { Document as DocumentView } from '../Document/index.js'
import { ForgotPassword, forgotPasswordBaseClass } from '../ForgotPassword/index.js'
import { ListView } from '../List/index.js'
import { Login, loginBaseClass } from '../Login/index.js'
import { Logout, LogoutInactivity } from '../Logout/index.js'
import { ResetPassword, resetPasswordBaseClass } from '../ResetPassword/index.js'
import { Unauthorized } from '../Unauthorized/index.js'
import { Verify, verifyBaseClass } from '../Verify/index.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

export { generatePageMetadata } from './meta.js'

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18n
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

const baseClasses = {
  forgot: forgotPasswordBaseClass,
  login: loginBaseClass,
  reset: resetPasswordBaseClass,
  verify: verifyBaseClass,
}

const oneSegmentViews = {
  'create-first-user': CreateFirstUser,
  forgot: ForgotPassword,
  login: Login,
  logout: Logout,
  'logout-inactivity': LogoutInactivity,
  unauthorized: Unauthorized,
}

export const RootPage = async ({
  config: configPromise,
  params,
  searchParams,
}: {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string | string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}) => {
  const config = await configPromise

  const {
    admin: { user: userSlug },
    routes: { admin: adminRoute },
  } = config

  let ViewToRender: React.FC<AdminViewProps>
  let templateClassName
  let templateType: 'default' | 'minimal' = 'default'

  let route = adminRoute

  if (Array.isArray(params.segments)) {
    route = route + '/' + params.segments.join('/')
  }

  const segments = Array.isArray(params.segments) ? params.segments : []

  const [segmentOne, segmentTwo] = segments

  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'

  const initPageOptions: Parameters<typeof initPage>[0] = {
    config,
    route,
    searchParams,
  }

  switch (segments.length) {
    case 0: {
      ViewToRender = Dashboard
      templateClassName = 'dashboard'
      templateType = 'default'
      initPageOptions.redirectUnauthenticatedUser = true
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
      } else {
        // find custom views
        ViewToRender = getCustomViewByRoute({ config, route })
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

  let dbHasUser = false

  if (!ViewToRender) {
    notFound()
  }

  const initPageResult = await initPage(initPageOptions)

  if (initPageResult) {
    dbHasUser = await initPageResult?.req.payload.db
      .findOne({
        collection: userSlug,
        req: initPageResult?.req,
      })
      ?.then((doc) => !!doc)

    const createFirstUserRoute = `${adminRoute}/create-first-user`

    if (!dbHasUser && route !== createFirstUserRoute) {
      redirect(createFirstUserRoute)
    }

    if (dbHasUser && route === createFirstUserRoute) {
      redirect(adminRoute)
    }
  }

  if (templateType === 'minimal') {
    return (
      <MinimalTemplate className={templateClassName}>
        <ViewToRender initPageResult={initPageResult} params={params} searchParams={searchParams} />
      </MinimalTemplate>
    )
  } else {
    return (
      <DefaultTemplate
        config={config}
        i18n={initPageResult.req.i18n}
        permissions={initPageResult.permissions}
        user={initPageResult.req.user}
      >
        <ViewToRender initPageResult={initPageResult} params={params} searchParams={searchParams} />
      </DefaultTemplate>
    )
  }
}
