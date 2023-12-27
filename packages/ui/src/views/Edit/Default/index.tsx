import React, { Fragment } from 'react'

import type { FieldTypes } from '../../../forms/field-types'
import type { CollectionEditViewProps } from '../../types'

// import { getTranslation } from 'payload/utilities'
import { DocumentControls } from '../../../elements/DocumentControls'
import { DocumentFields } from '../../../elements/DocumentFields'
import { LeaveWithoutSaving } from '../../../elements/LeaveWithoutSaving'
// import Meta from '../../../../utilities/Meta'
import Auth from '../Auth'
import { SetStepNav } from '../SetStepNav'
// import { Upload } from '../Upload'
import './index.scss'

const baseClass = 'collection-default-edit'

export const DefaultCollectionEdit: React.FC<
  CollectionEditViewProps & {
    fieldTypes: FieldTypes
  }
> = (props) => {
  const {
    id,
    apiURL,
    config,
    collectionConfig,
    data,
    disableActions,
    disableLeaveWithoutSaving,
    fieldTypes,
    hasSavePermission,
    internalState,
    isEditing,
    permissions,
  } = props

  const { auth, fields, upload } = collectionConfig

  const operation = isEditing ? 'update' : 'create'

  return (
    <Fragment>
      {/* <Meta
        description={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
          collection.labels.singular,
          i18n,
        )}`}
        keywords={`${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`}
        title={`${isEditing ? t('editing') : t('creating')} - ${getTranslation(
          collection.labels.singular,
          i18n,
        )}`}
      /> */}
      {!(collectionConfig.versions?.drafts && collectionConfig.versions?.drafts?.autosave) &&
        !disableLeaveWithoutSaving && <LeaveWithoutSaving />}
      <SetStepNav
        collectionSlug={collectionConfig?.slug}
        useAsTitle={collectionConfig?.admin?.useAsTitle}
        id={id}
        isEditing={isEditing}
        pluralLabel={collectionConfig?.labels?.plural}
      />
      <DocumentControls
        apiURL={apiURL}
        config={config}
        collectionConfig={collectionConfig}
        data={data}
        disableActions={disableActions}
        hasSavePermission={hasSavePermission}
        id={id}
        isEditing={isEditing}
        permissions={permissions}
      />
      <DocumentFields
        BeforeFields={
          <Fragment>
            {auth && (
              <Auth
                className={`${baseClass}__auth`}
                collectionSlug={collectionConfig.slug}
                email={data?.email}
                operation={operation}
                readOnly={!hasSavePermission}
                requirePassword={!isEditing}
                useAPIKey={auth.useAPIKey}
                verify={auth.verify}
              />
            )}
            {/* {upload && <Upload collection={collection} internalState={internalState} />} */}
          </Fragment>
        }
        fieldTypes={fieldTypes}
        fields={fields}
        hasSavePermission={hasSavePermission}
        permissions={permissions}
      />
    </Fragment>
  )
}
