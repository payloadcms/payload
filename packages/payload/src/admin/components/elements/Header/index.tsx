import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../exports/types'

import Account from '../../graphics/Account'
import { useCollectionGlobalConfigs } from '../../utilities/CollectionGlobalConfigs'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { getPathSegmentInfo } from '../../utilities/PathSegmentInfo'
import { Hamburger } from '../Hamburger'
import Localizer from '../Localizer'
import { LocalizerLabel } from '../Localizer/LocalizerLabel'
import { NavToggler } from '../Nav/NavToggler'
import { useNav } from '../Nav/context'
import StepNav from '../StepNav'
import './index.scss'

const baseClass = 'app-header'

const isSanitizedCollectionConfig = (config): config is SanitizedCollectionConfig => {
  return config && config.admin && config.admin.components && config.admin.components.views
}

const isSanitizedGlobalConfig = (config): config is SanitizedGlobalConfig => {
  return config && config.admin && config.admin.components && config.admin.components.views
}

const hasActions = (viewConfig): viewConfig is { actions: React.ComponentType<any>[] } => {
  return typeof viewConfig === 'object' && viewConfig !== null && 'actions' in viewConfig
}

export const AppHeader: React.FC = () => {
  const { t } = useTranslation()

  const {
    admin: {
      components: { actions: adminActions },
    },
    localization,
    routes: { admin: adminRoute },
  } = useConfig()

  const location = useLocation()
  const pathSegments = location.pathname.split('/')

  const {
    isAPIView: isCollectionAPIView,
    isEditView: isCollectionEditView,
    isListView: isCollectionListView,
    isLivePreviewView: isCollectionLivePreviewView,
    isVersionView: isCollectionVersionView,
    isVersionsView: isCollectionVersionsView,
    slug: urlCollectionSlug,
  } = getPathSegmentInfo(pathSegments, 'collections')

  const {
    isAPIView: isGlobalAPIView,
    isEditView: isGlobalEditView,
    isLivePreviewView: isGlobalLivePreviewView,
    isVersionView: isGlobalVersionView,
    isVersionsView: isGlobalVersionsView,
    slug: urlGlobalSlug,
  } = getPathSegmentInfo(pathSegments, 'globals')

  const { collection, global } = useDocumentInfo()
  const collectionSlug = collection?.slug
  const [collectionConfig] = useCollectionGlobalConfigs(collectionSlug, [urlCollectionSlug])
  let collectionActions = []

  if (isSanitizedCollectionConfig(collectionConfig)) {
    const editViewsConfig = collectionConfig.admin.components.views.Edit

    if (editViewsConfig && typeof editViewsConfig === 'object') {
      if (isCollectionAPIView && hasActions(editViewsConfig.API)) {
        collectionActions = editViewsConfig.API?.actions ?? []
      } else if (isCollectionVersionsView && hasActions(editViewsConfig.Versions)) {
        collectionActions = editViewsConfig.Versions?.actions ?? []
      } else if (isCollectionVersionView && hasActions(editViewsConfig.Version)) {
        collectionActions = editViewsConfig.Version?.actions ?? []
      } else if (isCollectionLivePreviewView && hasActions(editViewsConfig.LivePreview)) {
        collectionActions = editViewsConfig.LivePreview?.actions ?? []
      } else if (isCollectionEditView && hasActions(editViewsConfig.Default)) {
        collectionActions = editViewsConfig.Default?.actions ?? []
      } else if (
        isCollectionListView &&
        typeof collectionConfig.admin.components.views.List === 'object' &&
        'actions' in collectionConfig.admin.components.views.List
      ) {
        collectionActions = collectionConfig.admin.components.views.List.actions
      }
    }
  }

  const globalSlug = global?.slug
  const [globalConfig] = useCollectionGlobalConfigs(globalSlug, [urlGlobalSlug])
  let globalActions = []

  if (isSanitizedGlobalConfig(globalConfig)) {
    const globalEditViewsConfig = globalConfig.admin.components.views.Edit

    if (globalEditViewsConfig && typeof globalEditViewsConfig === 'object') {
      if (isGlobalAPIView && hasActions(globalEditViewsConfig.API)) {
        globalActions = globalEditViewsConfig.API?.actions ?? []
      } else if (isGlobalVersionsView && hasActions(globalEditViewsConfig.Versions)) {
        globalActions = globalEditViewsConfig.Versions?.actions ?? []
      } else if (isGlobalVersionView && hasActions(globalEditViewsConfig.Version)) {
        globalActions = globalEditViewsConfig.Version?.actions ?? []
      } else if (isGlobalLivePreviewView && hasActions(globalEditViewsConfig.LivePreview)) {
        globalActions = globalEditViewsConfig.LivePreview?.actions ?? []
      } else if (isGlobalEditView && hasActions(globalEditViewsConfig.Default)) {
        globalActions = globalEditViewsConfig.Default?.actions ?? []
      }
    }
  }

  const isGlobalView =
    isGlobalEditView ||
    isGlobalAPIView ||
    isGlobalVersionsView ||
    isGlobalVersionView ||
    isGlobalLivePreviewView
  const isCollectionView =
    isCollectionEditView ||
    isCollectionAPIView ||
    isCollectionListView ||
    isCollectionLivePreviewView ||
    isCollectionVersionsView ||
    isCollectionVersionView

  const { navOpen } = useNav()

  return (
    <header className={[baseClass, navOpen && `${baseClass}--nav-open`].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__bg`} />
      <div className={`${baseClass}__content`}>
        <div className={`${baseClass}__wrapper`}>
          <NavToggler className={`${baseClass}__mobile-nav-toggler`} tabIndex={-1}>
            <Hamburger />
          </NavToggler>
          <div className={`${baseClass}__controls-wrapper`}>
            <div className={`${baseClass}__step-nav-wrapper`}>
              <StepNav className={`${baseClass}__step-nav`} />
            </div>
            <div className={`${baseClass}__controls`}>
              {Boolean(isGlobalView) &&
                Array.isArray(globalActions) &&
                globalActions.map((Component, i) => <Component key={i} />)}
              {Boolean(isCollectionView) &&
                Array.isArray(collectionActions) &&
                collectionActions.map((Component, i) => <Component key={i} />)}
              {Array.isArray(adminActions) &&
                adminActions.map((Component, i) => <Component key={i} />)}
              {localization && (
                <LocalizerLabel
                  ariaLabel="invisible"
                  className={`${baseClass}__localizer-spacing`}
                />
              )}
              <Link
                aria-label={t('authentication:account')}
                className={`${baseClass}__account`}
                tabIndex={0}
                to={`${adminRoute}/account`}
              >
                <Account />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Localizer className={`${baseClass}__localizer`} />
    </header>
  )
}
