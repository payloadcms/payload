import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import type { CollectionEditViewProps } from '../../../types'

import { getTranslation } from '../../../../../../utilities/getTranslation'
import { DocumentControls } from '../../../../elements/DocumentControls'
import { DocumentFields } from '../../../../elements/DocumentFields'
import { LeaveWithoutSaving } from '../../../../modals/LeaveWithoutSaving'
import Meta from '../../../../utilities/Meta'
import Auth from '../Auth'
import { SetStepNav } from '../SetStepNav'
import { Upload } from '../Upload'
import './index.scss'

const baseClass = 'collection-default-edit'

export const DefaultCollectionEdit: React.FC<CollectionEditViewProps> = (props) => {
  const { i18n, t } = useTranslation('general')

  const {
    id,
    apiURL,
    collection,
    data,
    disableActions,
    disableLeaveWithoutSaving,
    hasSavePermission,
    internalState,
    isEditing,
    permissions,
  } = props

  const { auth, fields, upload } = collection

  const operation = isEditing ? 'update' : 'create'

  return (
    <Fragment>
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
      <DocumentFields
        BeforeFields={() => (
          <Fragment>
            {auth && (
              <Auth
                className={`${baseClass}__auth`}
                collection={collection}
                email={data?.email}
                operation={operation}
                readOnly={!hasSavePermission}
                requirePassword={!isEditing}
                useAPIKey={auth.useAPIKey}
                verify={auth.verify}
              />
            )}
            {upload && <Upload collection={collection} internalState={internalState} />}
          </Fragment>
        )}
        fields={fields}
        hasSavePermission={hasSavePermission}
        permissions={permissions}
      />
    </Fragment>
  )
}
