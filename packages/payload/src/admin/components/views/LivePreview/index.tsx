import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../../../../exports/types'
import type { EditViewProps } from '../types'

import { getTranslation } from '../../../../utilities/getTranslation'
import { DocumentControls } from '../../elements/DocumentControls'
import { Gutter } from '../../elements/Gutter'
import RenderFields from '../../forms/RenderFields'
import { filterFields } from '../../forms/RenderFields/filterFields'
import { fieldTypes } from '../../forms/field-types'
import { LeaveWithoutSaving } from '../../modals/LeaveWithoutSaving'
import Meta from '../../utilities/Meta'
import { SetStepNav } from '../collections/Edit/SetStepNav'
import { LivePreview } from './Preview'
import './index.scss'
import { usePopupWindow } from './usePopupWindow'

const baseClass = 'live-preview'

export const LivePreviewView: React.FC<EditViewProps> = (props) => {
  const { i18n, t } = useTranslation('general')

  let url

  if ('collection' in props) {
    url = props?.collection.admin.livePreview.url
  }

  if ('global' in props) {
    url = props?.global.admin.livePreview.url
  }

  const popupState = usePopupWindow({
    eventType: 'livePreview',
    href: url,
  })

  const { apiURL, data, permissions } = props

  let collection: SanitizedCollectionConfig
  let global: SanitizedGlobalConfig
  let disableActions: boolean
  let disableLeaveWithoutSaving: boolean
  let hasSavePermission: boolean
  let isEditing: boolean
  let id: string

  if ('collection' in props) {
    collection = props?.collection
    disableActions = props?.disableActions
    disableLeaveWithoutSaving = props?.disableLeaveWithoutSaving
    hasSavePermission = props?.hasSavePermission
    isEditing = props?.isEditing
    id = props?.id
  }

  if ('global' in props) {
    global = props?.global
  }

  const { fields } = collection

  const sidebarFields = filterFields({
    fieldSchema: fields,
    fieldTypes,
    filter: (field) => field?.admin?.position === 'sidebar',
    permissions: permissions.fields,
    readOnly: !hasSavePermission,
  })

  return (
    <Fragment>
      <SetStepNav collection={collection} global={global} id={id} isEditing={isEditing} />
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
        className={[baseClass, popupState?.isPopupOpen && `${baseClass}--detached`]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className={[
            `${baseClass}__main`,
            popupState?.isPopupOpen && `${baseClass}__main--popup-open`,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Meta
            description={t('editing')}
            keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
            title={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
              collection.labels.singular,
              i18n,
            )}`}
          />
          {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) &&
            !disableLeaveWithoutSaving && <LeaveWithoutSaving />}
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
        <LivePreview {...props} popupState={popupState} url={url} />
      </div>
    </Fragment>
  )
}
