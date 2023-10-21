import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { LivePreviewConfig } from '../../../../exports/config'
import type { Field } from '../../../../fields/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'
import type { EditViewProps } from '../types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { DocumentControls } from '../../elements/DocumentControls'
import { Gutter } from '../../elements/Gutter'
import RenderFields from '../../forms/RenderFields'
import { filterFields } from '../../forms/RenderFields/filterFields'
import { fieldTypes } from '../../forms/field-types'
import { LeaveWithoutSaving } from '../../modals/LeaveWithoutSaving'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import Meta from '../../utilities/Meta'
import { SetStepNav } from '../collections/Edit/SetStepNav'
import { LivePreviewProvider } from './Context'
import { useLivePreviewContext } from './Context/context'
import { LivePreview } from './Preview'
import './index.scss'
import { usePopupWindow } from './usePopupWindow'

const baseClass = 'live-preview'

const PreviewView: React.FC<EditViewProps> = (props) => {
  const { i18n, t } = useTranslation('general')
  const { previewWindowType } = useLivePreviewContext()

  const { apiURL, data, permissions } = props

  let collection: SanitizedCollectionConfig
  let global: SanitizedGlobalConfig
  let disableActions: boolean
  let disableLeaveWithoutSaving: boolean
  let hasSavePermission: boolean
  let isEditing: boolean
  let id: string
  let fields: Field[] = []
  let label: SanitizedGlobalConfig['label']

  if ('collection' in props) {
    collection = props?.collection
    disableActions = props?.disableActions
    disableLeaveWithoutSaving = props?.disableLeaveWithoutSaving
    hasSavePermission = props?.hasSavePermission
    isEditing = props?.isEditing
    id = props?.id
    fields = props?.collection?.fields
  }

  if ('global' in props) {
    global = props?.global
    fields = props?.global?.fields
    label = props?.global?.label
  }

  const sidebarFields = filterFields({
    fieldSchema: fields,
    fieldTypes,
    filter: (field) => field?.admin?.position === 'sidebar',
    permissions: permissions.fields,
    readOnly: !hasSavePermission,
  })

  return (
    <Fragment>
      {collection && (
        <Meta
          description={t('editing')}
          keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
          title={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
            collection.labels.singular,
            i18n,
          )}`}
        />
      )}
      {global && (
        <Meta
          description={getTranslation(label, i18n)}
          keywords={`${getTranslation(label, i18n)}, Payload, CMS`}
          title={getTranslation(label, i18n)}
        />
      )}
      {((collection && !(collection.versions?.drafts && collection.versions?.drafts?.autosave)) ||
        (global && !(global.versions?.drafts && global.versions?.drafts?.autosave))) &&
        !disableLeaveWithoutSaving && <LeaveWithoutSaving />}
      <SetStepNav
        collection={collection}
        global={global}
        id={id}
        isEditing={isEditing}
        view={t('livePreview')}
      />
      <DocumentControls
        apiURL={apiURL}
        collection={collection}
        data={data}
        disableActions={disableActions}
        global={global}
        hasSavePermission={hasSavePermission}
        id={id}
        isEditing={isEditing}
        permissions={permissions}
      />
      <div
        className={[baseClass, previewWindowType === 'popup' && `${baseClass}--detached`]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className={[
            `${baseClass}__main`,
            previewWindowType === 'popup' && `${baseClass}__main--popup-open`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Gutter className={`${baseClass}__edit`}>
            <RenderFields
              fieldSchema={fields}
              fieldTypes={fieldTypes}
              filter={(field) => !field?.admin?.position || field?.admin?.position !== 'sidebar'}
              permissions={permissions.fields}
              readOnly={!hasSavePermission}
            />
            {sidebarFields && sidebarFields.length > 0 && (
              <RenderFields fieldTypes={fieldTypes} fields={sidebarFields} />
            )}
          </Gutter>
        </div>
        <LivePreview {...props} />
      </div>
    </Fragment>
  )
}

export const LivePreviewView: React.FC<EditViewProps> = (props) => {
  const config = useConfig()
  const documentInfo = useDocumentInfo()
  const locale = useLocale()

  let livePreviewConfig: LivePreviewConfig = config?.admin?.livePreview

  if ('collection' in props) {
    livePreviewConfig = {
      ...(livePreviewConfig || {}),
      ...(props?.collection.admin.livePreview || {}),
    }
  }

  if ('global' in props) {
    livePreviewConfig = {
      ...(livePreviewConfig || {}),
      ...(props?.global.admin.livePreview || {}),
    }
  }

  const url =
    typeof livePreviewConfig?.url === 'function'
      ? livePreviewConfig?.url({
          data: props?.data,
          documentInfo,
          locale,
        })
      : livePreviewConfig?.url

  const breakpoints: LivePreviewConfig['breakpoints'] = [
    ...(livePreviewConfig?.breakpoints || []),
    {
      name: 'responsive',
      height: '100%',
      label: 'Responsive',
      width: '100%',
    },
  ]

  const { isPopupOpen, openPopupWindow, popupRef } = usePopupWindow({
    eventType: 'payload-live-preview',
    url,
  })

  return (
    <LivePreviewProvider
      {...props}
      breakpoints={breakpoints}
      isPopupOpen={isPopupOpen}
      openPopupWindow={openPopupWindow}
      popupRef={popupRef}
      url={url}
    >
      <PreviewView {...props} />
    </LivePreviewProvider>
  )
}
