import type { SanitizedConfig } from 'payload/types'

import { DefaultTemplate, MinimalTemplate } from '@payloadcms/ui'
import React from 'react'

import { getNextI18n } from '../../utilities/getNextI18n'
import { initPage } from '../../utilities/initPage'
import { meta } from '../../utilities/meta'
import { Account } from '../Account'
import { CreateFirstUser } from '../CreateFirstUser'
import { Dashboard } from '../Dashboard'
import { Document as DocumentView } from '../Document'
import { ForgotPassword } from '../ForgotPassword'
import { ListView } from '../List'
import { Login } from '../Login'
import { Logout, LogoutInactivity } from '../Logout'
import { ResetPassword } from '../ResetPassword'
import { Unauthorized } from '../Unauthorized'
import Verify from '../Verify'

type Args = {
  config: Promise<SanitizedConfig>
  params: {
    [key: string]: string | string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

const baseClasses = {
  forgot: 'forgot-password',
  login: 'login',
  reset: 'reset-password',
  verify: 'verify',
}

const oneSegmentViews = {
  'create-first-user': CreateFirstUser,
  forgot: ForgotPassword,
  login: Login,
  logout: Logout,
  'logout-inactivity': LogoutInactivity,
  unauthorized: Unauthorized,
}

export const RootPage = async ({ config: configPromise, params, searchParams }: Args) => {
  const config = await configPromise
  let ViewToRender
  let templateClassName
  let pageData
  let templateType: 'default' | 'minimal' = 'default'

  let route = config.routes.admin
  if (Array.isArray(params.segments)) {
    route = route + '/' + params.segments.join('/')
  }

  const segments = Array.isArray(params.segments) ? params.segments : []

  const [segmentOne, segmentTwo] = segments

  const isGlobal = segmentOne === 'globals'
  const isCollection = segmentOne === 'collections'

  // TODO: handle custom routes

  switch (segments.length) {
    case 0: {
      ViewToRender = Dashboard
      templateClassName = 'dashboard'
      templateType = 'default'
      pageData = await initPage({ config, route, searchParams })
      break
    }
    case 1: {
      if (oneSegmentViews[segmentOne] && segmentOne !== 'account') {
        // /create-first-user
        // /forgot
        // /login
        // /logout
        // /logout-inactivity
        // /unauthorized
        pageData = await initPage({ config, route, searchParams })
        ViewToRender = oneSegmentViews[segmentOne]
        templateClassName = baseClasses[segmentOne]
        templateType = 'minimal'
      } else if (segmentOne === 'account') {
        // /account
        pageData = await initPage({ config, route, searchParams })
        ViewToRender = Account
        templateClassName = 'account'
        templateType = 'default'
      }
      break
    }
    case 2: {
      if (segmentTwo === 'reset') {
        // /reset/:token
        pageData = await initPage({ config, route, searchParams })
        ViewToRender = ResetPassword
        templateClassName = baseClasses[segmentTwo]
        templateType = 'minimal'
      }
      if (isCollection) {
        // /collections/:collectionSlug
        pageData = await initPage({ config, route, searchParams })
        ViewToRender = ListView
        templateClassName = `${segmentTwo}-list`
        templateType = 'default'
      } else if (isGlobal) {
        // /globals/:globalSlug
        pageData = await initPage({ config, route, searchParams })
        ViewToRender = DocumentView
        templateClassName = 'global-edit'
        templateType = 'default'
      }
      break
    }
    default:
      if (isCollection) {
        if (segmentTwo === 'verify') {
          // /:collectionSlug/verify/:token
          pageData = await initPage({ config, route, searchParams })
          ViewToRender = Verify
          templateClassName = 'global-edit'
          templateType = 'minimal'
        } else {
          // /collections/:collectionSlug/:id
          // /collections/:collectionSlug/:id/preview
          // /collections/:collectionSlug/:id/versions
          // /collections/:collectionSlug/:id/versions/:versionId
          // /collections/:collectionSlug/:id/api
          pageData = await initPage({ config, route, searchParams })
          ViewToRender = DocumentView
          templateClassName = `collection-versions`
          templateType = 'default'
        }
      } else if (isGlobal) {
        // /globals/:globalSlug
        // /globals/:globalSlug/preview
        // /globals/:globalSlug/versions
        // /globals/:globalSlug/versions/:versionId
        // /globals/:globalSlug/api
        pageData = await initPage({ config, route, searchParams })
        ViewToRender = DocumentView
        templateClassName = `global-versions`
        templateType = 'default'
      }
      break
  }

  if (pageData) {
    if (templateType === 'minimal') {
      return (
        <MinimalTemplate className={templateClassName}>
          <ViewToRender page={pageData} params={params} searchParams={searchParams} />
        </MinimalTemplate>
      )
    } else {
      return (
        <DefaultTemplate
          config={config}
          i18n={pageData.req.i18n}
          permissions={pageData.permissions}
          user={pageData.req.user}
        >
          <ViewToRender page={pageData} params={params} searchParams={searchParams} />
        </DefaultTemplate>
      )
    }
  }

  return null
}

export const generateMeta = async ({ config: configPromise, params, searchParams }: Args) => {
  const config = await configPromise

  const { t } = await getNextI18n({
    config,
  })

  return meta({
    config,
    description: 'Payload',
    keywords: 'Payload',
    title: 'Payload',
    // description: `${t('authentication:logoutUser')}`,
    // keywords: `${t('authentication:logout')}`,
    // title: t('authentication:logout'),
  })
}
