import React, { Fragment } from 'react'

import { DefaultTemplate } from '../../templates/Default/index.js'
import { MinimalTemplate } from '../../templates/Minimal/index.js'

export const RootViewComponent = ({
  documentSubViewType,
  initPageResult,
  params,
  RenderedView,
  searchParams,
  serverProps,
  templateClassName,
  templateType,
  viewType,
}) => {
  return (
    <Fragment>
      {!templateType && <Fragment>{RenderedView}</Fragment>}
      {templateType === 'minimal' && (
        <MinimalTemplate className={templateClassName}>{RenderedView}</MinimalTemplate>
      )}
      {templateType === 'default' && (
        <DefaultTemplate
          collectionSlug={initPageResult?.collectionConfig?.slug}
          docID={initPageResult?.docID}
          documentSubViewType={documentSubViewType}
          globalSlug={initPageResult?.globalConfig?.slug}
          i18n={initPageResult?.req.i18n}
          locale={initPageResult?.locale}
          params={params}
          payload={initPageResult?.req.payload}
          permissions={initPageResult?.permissions}
          searchParams={searchParams}
          user={initPageResult?.req.user}
          viewActions={serverProps.viewActions}
          viewType={viewType}
          visibleEntities={{
            collections: initPageResult?.visibleEntities?.collections,
            globals: initPageResult?.visibleEntities?.globals,
          }}
        >
          {RenderedView}
        </DefaultTemplate>
      )}
    </Fragment>
  )
}
