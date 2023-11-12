import React from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../../../collections/config/types'

import { Submit } from '../../../../../../../exports/components/forms'
import { fieldAffectsData } from '../../../../../../../exports/types'
import { getTranslation } from '../../../../../../../utilities/getTranslation'
import { Drawer } from '../../../../../elements/Drawer'
import Eyebrow from '../../../../../elements/Eyebrow'
import { Gutter } from '../../../../../elements/Gutter'
import { FormLoadingOverlayToggle } from '../../../../../elements/Loading'
import RenderTitle from '../../../../../elements/RenderTitle'
import Form from '../../../../../forms/Form'
import RenderFields from '../../../../../forms/RenderFields'
import { fieldTypes } from '../../../../../forms/field-types'
import { LeaveWithoutSaving } from '../../../../../modals/LeaveWithoutSaving'
import { useAuth } from '../../../../../utilities/Auth'
import { useConfig } from '../../../../../utilities/Config'
import { useLocale } from '../../../../../utilities/Locale'
import { Upload } from '../../../Edit/Upload'
import { AddFilesDrawer } from '../AddFilesDrawer'
import { useBulkUploadFormData } from '../Provider'
import { FilePreview } from './FilePreview'
import './index.scss'

export const manageFilesDrawerSlug = 'manage-files-drawer'
const addFilesDrawerSlug = 'manage-files-add-more-drawer'
const baseClass = 'manage-files-drawer'
type Props = {
  collection: SanitizedCollectionConfig
  initialFiles: FileList
}
export const ManageFilesDrawer: React.FC<Props> = ({ collection, initialFiles }) => {
  const { dispatchAction, state } = useBulkUploadFormData()
  const { i18n, t } = useTranslation('general')
  const { permissions } = useAuth()
  const { code: locale } = useLocale()
  const [files, setFiles] = React.useState<FileList>(initialFiles)
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const {
    admin: { useAsTitle },
    slug,
  } = collection

  const docPermissions = permissions.collections[collection.slug]
  const action = `${serverURL}${api}/${slug}?locale=${locale}&depth=0&fallback-locale=null`
  const hasSavePermission = docPermissions.create?.permission

  const onDrop = React.useCallback((droppedFiles: FileList) => {
    setFiles(droppedFiles)
  }, [])

  const handleChangePreview = React.useCallback(
    (index: number) => {
      dispatchAction({
        index,
        type: 'SET_ACTIVE_INDEX',
      })
    },
    [dispatchAction],
  )

  const selectedFormData = state.allFormData[state.activeIndex]

  return (
    <Drawer className={baseClass} header={false} slug={manageFilesDrawerSlug}>
      <div className={`${baseClass}__file-list`}>
        {Array.from(files).map((file, fileIndex) => (
          <FilePreview
            file={file}
            key={`${file.name}-${fileIndex}`}
            // onDelete={null}
            // onSelect={() => handleChangePreview(fileIndex)}
          />
        ))}
      </div>

      <div className={`${baseClass}__edit-area`}>
        <div className={`${baseClass}__main`}>
          <div>
            <Form
              className={`${baseClass}__form`}
              disableSuccessStatus
              disabled={!hasSavePermission}
              initialData={selectedFormData}
              onSubmit={(data) => console.log(data)}
            >
              <FormLoadingOverlayToggle
                action="create"
                loadingSuffix={getTranslation(collection.labels.singular, i18n)}
                name={`collection-edit--${getTranslation(collection.labels.singular, i18n)}`}
                type="withoutNav"
              />

              <div>
                <Eyebrow />

                <LeaveWithoutSaving />

                <Gutter>
                  <header className={`${baseClass}__header`}>
                    <h1>
                      <RenderTitle
                        collection={collection}
                        data={selectedFormData}
                        fallback={`[${t('untitled')}]`}
                        useAsTitle={useAsTitle}
                      />
                    </h1>
                  </header>

                  <Upload collection={collection} />

                  <RenderFields
                    fieldSchema={collection.fields}
                    fieldTypes={fieldTypes}
                    filter={(field) => {
                      if (fieldAffectsData(field) && field.name === 'id') {
                        return false
                      }
                      return !field?.admin?.position || field?.admin?.position !== 'sidebar'
                    }}
                    permissions={docPermissions.fields}
                    readOnly={!hasSavePermission}
                  />
                </Gutter>
              </div>

              <div className={`${baseClass}__sidebar-wrap`}>
                <div className={`${baseClass}__sidebar`}>
                  {/* <div
                      className={[
                        `${baseClass}__document-actions`,
                        ((collection.versions?.drafts && !collection.versions?.drafts?.autosave) || (isEditing && preview)) && `${baseClass}__document-actions--has-2`,
                      ].filter(Boolean).join(' ')}
                    >
                      {hasSavePermission && (
                        <React.Fragment>
                          {collection.versions?.drafts ? (
                            <React.Fragment>
                              {!collection.versions.drafts.autosave && (
                                <SaveDraft CustomComponent={collection?.admin?.components?.edit?.SaveDraftButton} />
                              )}

                              <Publish
                                CustomComponent={collection?.admin?.components?.edit?.PublishButton}
                              />
                            </React.Fragment>
                          ) : (
                            <Save CustomComponent={collection?.admin?.components?.edit?.SaveButton} />
                          )}
                        </React.Fragment>
                      )}
                    </div> */}

                  <div className={`${baseClass}__sidebar-fields`}>
                    <RenderFields
                      fieldSchema={collection.fields}
                      fieldTypes={fieldTypes}
                      filter={(field) => field?.admin?.position === 'sidebar'}
                      permissions={docPermissions.fields}
                      readOnly={!hasSavePermission}
                    />
                  </div>
                </div>
              </div>
              <Submit />
            </Form>
          </div>
        </div>
      </div>

      <AddFilesDrawer onDrop={onDrop} slug={addFilesDrawerSlug} />
    </Drawer>
  )
}
