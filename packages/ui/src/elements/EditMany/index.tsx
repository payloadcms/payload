'use client'
import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useState } from 'react'

import type { Props } from './types'

import Form from '../../forms/Form'
import { useForm } from '../../forms/Form/context'
import FormSubmit from '../../forms/Submit'
import { X } from '../../icons/X'
import { useAuth } from '../../providers/Auth'
import { useConfig } from '../../providers/Config'
import { DocumentInfoProvider } from '../../providers/DocumentInfo'
import { OperationContext } from '../../providers/OperationProvider'
import { useSearchParams } from '../../providers/SearchParams'
import { SelectAllStatus, useSelection } from '../../providers/SelectionProvider'
import { useTranslation } from '../../providers/Translation'
import { Drawer, DrawerToggler } from '../Drawer'
import { FieldSelect } from '../FieldSelect'
import './index.scss'

const baseClass = 'edit-many'

const Submit: React.FC<{ action: string; disabled: boolean }> = ({ action, disabled }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    submit({
      action,
      method: 'PATCH',
      skipValidation: true,
    })
  }, [action, submit])

  return (
    <FormSubmit className={`${baseClass}__save`} disabled={disabled} onClick={save}>
      {t('general:save')}
    </FormSubmit>
  )
}
const Publish: React.FC<{ action: string; disabled: boolean }> = ({ action, disabled }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    submit({
      action,
      method: 'PATCH',
      overrides: {
        _status: 'published',
      },
      skipValidation: true,
    })
  }, [action, submit])

  return (
    <FormSubmit className={`${baseClass}__publish`} disabled={disabled} onClick={save}>
      {t('version:publishChanges')}
    </FormSubmit>
  )
}
const SaveDraft: React.FC<{ action: string; disabled: boolean }> = ({ action, disabled }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    submit({
      action,
      method: 'PATCH',
      overrides: {
        _status: 'draft',
      },
      skipValidation: true,
    })
  }, [action, submit])

  return (
    <FormSubmit className={`${baseClass}__draft`} disabled={disabled} onClick={save}>
      {t('version:saveDraft')}
    </FormSubmit>
  )
}
const EditMany: React.FC<Props> = (props) => {
  const { collection: { slug, fields, labels: { plural } } = {}, collection } = props

  const { permissions } = useAuth()
  const { closeModal } = useModal()
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { count, getQueryParams, selectAll } = useSelection()
  const { i18n, t } = useTranslation()
  const [selected, setSelected] = useState([])
  const { dispatchSearchParams } = useSearchParams()

  const collectionPermissions = permissions?.collections?.[slug]
  const hasUpdatePermission = collectionPermissions?.update?.permission

  const drawerSlug = `edit-${slug}`

  if (selectAll === SelectAllStatus.None || !hasUpdatePermission) {
    return null
  }

  const onSuccess = () => {
    dispatchSearchParams({
      type: 'set',
      browserHistory: 'replace',
      params: { page: selectAll === SelectAllStatus.AllAvailable ? '1' : undefined },
    })
  }

  return (
    <div className={baseClass}>
      <DrawerToggler
        aria-label={t('general:edit')}
        className={`${baseClass}__toggle`}
        onClick={() => {
          setSelected([])
        }}
        slug={drawerSlug}
      >
        {t('general:edit')}
      </DrawerToggler>
      <Drawer Header={null} slug={drawerSlug}>
        <DocumentInfoProvider collection={collection}>
          <OperationContext.Provider value="update">
            <Form className={`${baseClass}__form`} onSuccess={onSuccess}>
              <div className={`${baseClass}__main`}>
                <div className={`${baseClass}__header`}>
                  <h2 className={`${baseClass}__header__title`}>
                    {t('general:editingLabel', { count, label: getTranslation(plural, i18n) })}
                  </h2>
                  <button
                    aria-label={t('general:close')}
                    className={`${baseClass}__header__close`}
                    id={`close-drawer__${drawerSlug}`}
                    onClick={() => closeModal(drawerSlug)}
                    type="button"
                  >
                    <X />
                  </button>
                </div>
                <FieldSelect fields={fields} setSelected={setSelected} />
                [RenderFields]
                {/* <RenderFields fieldSchema={selected} fieldTypes={fieldTypes} /> */}
                <div className={`${baseClass}__sidebar-wrap`}>
                  <div className={`${baseClass}__sidebar`}>
                    <div className={`${baseClass}__sidebar-sticky-wrap`}>
                      <div className={`${baseClass}__document-actions`}>
                        {collection.versions ? (
                          <React.Fragment>
                            <Publish
                              action={`${serverURL}${api}/${slug}${getQueryParams()}`}
                              disabled={selected.length === 0}
                            />
                            <SaveDraft
                              action={`${serverURL}${api}/${slug}${getQueryParams()}`}
                              disabled={selected.length === 0}
                            />
                          </React.Fragment>
                        ) : (
                          <Submit
                            action={`${serverURL}${api}/${slug}${getQueryParams()}`}
                            disabled={selected.length === 0}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </OperationContext.Provider>
        </DocumentInfoProvider>
      </Drawer>
    </div>
  )
}

export default EditMany
