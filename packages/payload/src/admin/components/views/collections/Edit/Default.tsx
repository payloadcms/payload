import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import CopyToClipboard from '../../../elements/CopyToClipboard'
import { DocumentHeader } from '../../../elements/DocumentHeader'
import { Gutter } from '../../../elements/Gutter'
import { FormLoadingOverlayToggle } from '../../../elements/Loading'
import VersionsCount from '../../../elements/VersionsCount'
import Form from '../../../forms/Form'
import RenderFields from '../../../forms/RenderFields'
import fieldTypes from '../../../forms/field-types'
import LeaveWithoutSaving from '../../../modals/LeaveWithoutSaving'
import { useAuth } from '../../../utilities/Auth'
import Meta from '../../../utilities/Meta'
import { OperationContext } from '../../../utilities/OperationProvider'
import Auth from './Auth'
import { SetStepNav } from './SetStepNav'
import Upload from './Upload'
import './index.scss'

const baseClass = 'collection-edit'

const DefaultEditView: React.FC<Props> = (props) => {
  const { i18n, t } = useTranslation('general')
  const { refreshCookieAsync, user } = useAuth()

  const {
    action,
    apiURL,
    collection,
    customHeader,
    data,
    disableActions,
    disableLeaveWithoutSaving,
    hasSavePermission,
    id,
    internalState,
    isEditing,
    isLoading,
    onSave: onSaveFromProps,
    permissions,
  } = props

  const {
    admin: { hideAPIURL },
    auth,
    fields,
    upload,
    versions,
  } = collection

  const classes = [baseClass, isEditing && `${baseClass}--is-editing`].filter(Boolean).join(' ')

  const onSave = useCallback(
    async (json) => {
      if (auth && id === user.id) {
        await refreshCookieAsync()
      }

      if (typeof onSaveFromProps === 'function') {
        onSaveFromProps({
          ...json,
          operation: id ? 'update' : 'create',
        })
      }
    },
    [id, onSaveFromProps, auth, user, refreshCookieAsync],
  )

  const operation = isEditing ? 'update' : 'create'

  return (
    <React.Fragment>
      <div className={classes}>
        <OperationContext.Provider value={operation}>
          <Form
            action={action}
            className={`${baseClass}__form`}
            disabled={!hasSavePermission}
            initialState={internalState}
            method={id ? 'patch' : 'post'}
            onSuccess={onSave}
          >
            <FormLoadingOverlayToggle
              action={isLoading ? 'loading' : operation}
              formIsLoading={isLoading}
              loadingSuffix={getTranslation(collection.labels.singular, i18n)}
              name={`collection-edit--${collection.labels.singular}`}
              type="withoutNav"
            />
            {!isLoading && (
              <React.Fragment>
                <SetStepNav collection={collection} id={id} isEditing={isEditing} />
                <DocumentHeader
                  collection={collection}
                  customHeader={customHeader}
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
                      {upload && (
                        <Upload collection={collection} data={data} internalState={internalState} />
                      )}
                      <RenderFields
                        fieldSchema={fields}
                        fieldTypes={fieldTypes}
                        filter={(field) =>
                          !field?.admin?.position || field?.admin?.position !== 'sidebar'
                        }
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
                        {isEditing && (
                          <ul className={`${baseClass}__meta`}>
                            {!hideAPIURL && (
                              <li className={`${baseClass}__api-url`}>
                                <span className={`${baseClass}__label`}>
                                  API URL <CopyToClipboard value={apiURL} />
                                </span>
                                <a href={apiURL} rel="noopener noreferrer" target="_blank">
                                  {apiURL}
                                </a>
                              </li>
                            )}
                            {versions && (
                              <li>
                                <div className={`${baseClass}__label`}>{t('version:versions')}</div>
                                <VersionsCount collection={collection} id={id} />
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
          </Form>
        </OperationContext.Provider>
      </div>
    </React.Fragment>
  )
}

export default DefaultEditView
