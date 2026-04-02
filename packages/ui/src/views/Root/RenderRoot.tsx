import type {
  AdminViewClientProps,
  AdminViewServerPropsOnly,
  ImportMap,
  InitReqResult,
  NavPreferences,
} from 'payload'

import React from 'react'

import type { ViewComponentRenderer, WithViewRenderer } from '../../utilities/createViewRenderer.js'
import type { RootPageDescriptor } from './getRootPageDescriptor.js'

import { getNavPrefs } from '../../elements/Nav/getNavPrefs.js'
import { PageConfigProvider } from '../../providers/Config/index.js'
import { ViewRendererProvider } from '../../providers/ViewRenderer/index.js'
import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'
import { createViewRenderer } from '../../utilities/createViewRenderer.js'
import { getRootPageDescriptor } from './getRootPageDescriptor.js'

export type RenderRootPageArgs = {
  importMap: ImportMap
  initPageResult: InitReqResult
  /** Framework-specific notFound — throws framework error */
  notFound: () => never
  /** Framework-specific redirect — throws framework error */
  redirect: (url: string) => never
  searchParams: { [key: string]: string | string[] }
  segments: string[]
  viewRenderer?: ViewComponentRenderer
}

export type RenderRootPageFromDescriptorArgs = {
  descriptor: RootPageDescriptor
  navPreferences?: NavPreferences
} & RenderRootPageArgs

export const renderRootPageFromDescriptor = ({
  descriptor,
  importMap,
  initPageResult,
  navPreferences,
  notFound,
  redirect,
  searchParams,
  segments,
  viewRenderer,
}: RenderRootPageFromDescriptorArgs): React.ReactNode => {
  const {
    cookies,
    locale,
    permissions,
    req,
    req: { payload },
  } = initPageResult
  const {
    browseByFolderSlugs,
    clientConfig,
    collectionConfig,
    DefaultView,
    documentSubViewType,
    globalConfig,
    routeParams,
    templateClassName,
    templateType,
    viewActions,
    viewType,
    visibleEntities,
  } = descriptor

  const folderID = routeParams.folderID

  const params = { segments }
  const resolvedViewRenderer = viewRenderer ?? createViewRenderer({ importMap })
  type RootViewServerProps = {
    notFound: () => never
    payload: typeof req.payload
    redirect: (url: string) => never
    searchParams: { [key: string]: string | string[] }
  } & AdminViewServerPropsOnly &
    WithViewRenderer

  const RenderedView = resolvedViewRenderer({
    clientProps: {
      browseByFolderSlugs,
      clientConfig,
      documentSubViewType,
      viewType,
    } satisfies AdminViewClientProps,
    Component: DefaultView.payloadComponent,
    Fallback: DefaultView.Component,
    serverProps: {
      clientConfig,
      collectionConfig,
      docID: routeParams.id,
      folderID,
      globalConfig,
      i18n: req.i18n,
      importMap,
      initPageResult: {
        collectionConfig,
        cookies,
        docID: routeParams.id,
        globalConfig,
        languageOptions: Object.entries(req.payload.config.i18n.supportedLanguages || {}).reduce(
          (acc, [language, languageConfig]) => {
            if (Object.keys(req.payload.config.i18n.supportedLanguages).includes(language)) {
              acc.push({
                label: languageConfig.translations.general.thisLanguage,
                value: language,
              })
            }

            return acc
          },
          [],
        ),
        locale,
        permissions,
        req,
        translations: req.i18n.translations,
        visibleEntities,
      },
      // Inject framework-specific navigation callbacks so DocumentView and others can use them
      notFound,
      params,
      payload: req.payload,
      redirect,
      searchParams,
      viewActions,
      viewRenderer: resolvedViewRenderer,
    } satisfies RootViewServerProps,
  })

  return (
    <ViewRendererProvider renderer={resolvedViewRenderer}>
      <PageConfigProvider config={clientConfig}>
        {!templateType && <React.Fragment>{RenderedView}</React.Fragment>}
        {templateType === 'minimal' && (
          <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
        )}
        {templateType === 'default' && (
          <DefaultTemplate
            collectionSlug={collectionConfig?.slug}
            docID={routeParams.id}
            documentSubViewType={documentSubViewType}
            globalSlug={globalConfig?.slug}
            i18n={req.i18n}
            locale={locale}
            navPreferences={navPreferences}
            params={params}
            payload={req.payload}
            permissions={permissions}
            req={req}
            searchParams={searchParams}
            user={req.user}
            viewActions={viewActions}
            viewType={viewType}
            visibleEntities={{
              collections: visibleEntities?.collections,
              globals: visibleEntities?.globals,
            }}
          >
            {RenderedView}
          </DefaultTemplate>
        )}
      </PageConfigProvider>
    </ViewRendererProvider>
  )
}

/**
 * Framework-agnostic root page renderer.
 * Receives a pre-computed initPageResult and navigation callbacks from the framework adapter.
 */
export const renderRootPage = async ({
  importMap,
  initPageResult,
  notFound,
  redirect,
  searchParams,
  segments,
  viewRenderer,
}: RenderRootPageArgs): Promise<React.ReactNode> => {
  const rootPageResult = await getRootPageDescriptor({
    importMap,
    initPageResult,
    searchParams,
    segments,
  })

  if (rootPageResult.type === 'not-found') {
    return notFound()
  }

  if (rootPageResult.type === 'redirect') {
    return redirect(rootPageResult.url)
  }

  const navPreferences = await getNavPrefs(initPageResult.req)

  return renderRootPageFromDescriptor({
    descriptor: rootPageResult.descriptor,
    importMap,
    initPageResult,
    navPreferences,
    notFound,
    redirect,
    searchParams,
    segments,
    viewRenderer,
  })
}
