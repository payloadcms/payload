import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from '../types'

import { getTranslation } from '../../../../../../utilities/getTranslation'
import { DocumentControls } from '../../../../elements/DocumentControls'
import { Gutter } from '../../../../elements/Gutter'
import RenderFields from '../../../../forms/RenderFields'
import fieldTypes from '../../../../forms/field-types'
import LeaveWithoutSaving from '../../../../modals/LeaveWithoutSaving'
import Meta from '../../../../utilities/Meta'
import Auth from '../Auth'
import { SetStepNav } from '../SetStepNav'
import Upload from '../Upload'
import './index.scss'

const baseClass = 'collection-edit'

export const DefaultEdit: React.FC<Props> = (props) => {
  const { i18n, t } = useTranslation('general')

  const {
    apiURL,
    collection,
    data,
    disableActions,
    disableLeaveWithoutSaving,
    hasSavePermission,
    id,
    internalState,
    isEditing,
    permissions,
  } = props

  const { auth, fields, upload } = collection

  const operation = isEditing ? 'update' : 'create'

  return (
    <Fragment>
      <SetStepNav collection={collection} id={id} isEditing={isEditing} />
      <DocumentControls
        apiURL={apiURL}
        collection={collection}
        data={data}
        disableActions={disableActions}
        hasSavePermission={hasSavePermission}
        id={id}
        isEditing={isEditing}
        permissions={permissions}
      />
      <div className={`${baseClass}__wrapper`}>
        <div className={`${baseClass}__main`}>
          <Meta
            description={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
              collection.labels.singular,
              i18n,
            )}`}
            keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
            title={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
              collection.labels.singular,
              i18n,
            )}`}
          />
          {!(collection.versions?.drafts && collection.versions?.drafts?.autosave) &&
            !disableLeaveWithoutSaving && <LeaveWithoutSaving />}
          <Gutter className={`${baseClass}__edit`}>
            {auth && (
              <Auth
                collection={collection}
                email={data?.email}
                operation={operation}
                readOnly={!hasSavePermission}
                requirePassword={!isEditing}
                useAPIKey={auth.useAPIKey}
                verify={auth.verify}
              />
            )}
            {upload && <Upload collection={collection} data={data} internalState={internalState} />}
            <RenderFields
              fieldSchema={fields}
              fieldTypes={fieldTypes}
              filter={(field) => !field?.admin?.position || field?.admin?.position !== 'sidebar'}
              permissions={permissions.fields}
              readOnly={!hasSavePermission}
            />
          </Gutter>
        </div>
        <div className={`${baseClass}__sidebar-wrap`}>
          <div className={`${baseClass}__sidebar`}>
            <div className={`${baseClass}__sidebar-sticky-wrap`}>
              <div className={`${baseClass}__sidebar-fields`}>
                <RenderFields
                  fieldSchema={fields}
                  fieldTypes={fieldTypes}
                  filter={(field) => field?.admin?.position === 'sidebar'}
                  permissions={permissions.fields}
                  readOnly={!hasSavePermission}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
