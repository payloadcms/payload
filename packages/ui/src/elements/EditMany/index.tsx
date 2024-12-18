'use client'
import type { ClientCollectionConfig, FormState } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { FormProps } from '../../forms/Form/index.js'
import type { SelectedField } from '../FieldSelect/reduceSelectableFields.js'

import { useForm } from '../../forms/Form/context.js'
import { Form } from '../../forms/Form/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js'
import { EditDepthProvider } from '../../providers/EditDepth/index.js'
import { OperationContext } from '../../providers/Operation/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore } from '../../utilities/abortAndIgnore.js'
import './index.scss'
import { mergeListSearchAndWhere } from '../../utilities/mergeListSearchAndWhere.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { Drawer, DrawerToggler } from '../Drawer/index.js'
import { FieldSelect } from '../FieldSelect/index.js'

const baseClass = 'edit-many'

export type EditManyProps = {
  readonly collection: ClientCollectionConfig
}

const sanitizeUnselectedFields = (formState: FormState, selectedFields: SelectedField[]) => {
  const filteredData = selectedFields.reduce((acc, { path }) => {
    const foundState = formState?.[path]

    if (foundState) {
      acc[path] = formState?.[path]?.value
    }

    return acc
  }, {} as FormData)

  return filteredData
}

const Submit: React.FC<{
  readonly action: string
  readonly disabled: boolean
  readonly selectedFields?: SelectedField[]
}> = ({ action, disabled, selectedFields }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    void submit({
      action,
      method: 'PATCH',
      overrides: (formState) => sanitizeUnselectedFields(formState, selectedFields),
      skipValidation: true,
    })
  }, [action, submit, selectedFields])

  return (
    <FormSubmit className={`${baseClass}__save`} disabled={disabled} onClick={save}>
      {t('general:save')}
    </FormSubmit>
  )
}

const PublishButton: React.FC<{
  action: string
  disabled: boolean
  selectedFields?: SelectedField[]
}> = ({ action, disabled, selectedFields }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    void submit({
      action,
      method: 'PATCH',
      overrides: (formState) => ({
        ...sanitizeUnselectedFields(formState, selectedFields),
        _status: 'published',
      }),
      skipValidation: true,
    })
  }, [action, submit, selectedFields])

  return (
    <FormSubmit className={`${baseClass}__publish`} disabled={disabled} onClick={save}>
      {t('version:publishChanges')}
    </FormSubmit>
  )
}

const SaveDraftButton: React.FC<{
  action: string
  disabled: boolean
  selectedFields?: SelectedField[]
}> = ({ action, disabled, selectedFields }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    void submit({
      action,
      method: 'PATCH',
      overrides: (formState) => ({
        ...sanitizeUnselectedFields(formState, selectedFields),
        _status: 'draft',
      }),
      skipValidation: true,
    })
  }, [action, submit, selectedFields])

  return (
    <FormSubmit
      buttonStyle="secondary"
      className={`${baseClass}__draft`}
      disabled={disabled}
      onClick={save}
    >
      {t('version:saveDraft')}
    </FormSubmit>
  )
}

export const EditMany: React.FC<EditManyProps> = (props) => {
  const { collection: { slug: collectionSlug, fields, labels: { plural } } = {}, collection } =
    props

  const { permissions, user } = useAuth()

  const { closeModal } = useModal()

  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()

  const { getFormState } = useServerFunctions()

  const { count, getQueryParams, selectAll } = useSelection()
  const { i18n, t } = useTranslation()
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  const [initialState, setInitialState] = useState<FormState>()
  const hasInitializedState = React.useRef(false)
  const formStateAbortControllerRef = React.useRef<AbortController>(null)
  const { clearRouteCache } = useRouteCache()
  const collectionPermissions = permissions?.collections?.[collectionSlug]
  const hasUpdatePermission = collectionPermissions?.update

  const drawerSlug = `edit-${collectionSlug}`

  React.useEffect(() => {
    const controller = new AbortController()

    if (!hasInitializedState.current) {
      const getInitialState = async () => {
        const { state: result } = await getFormState({
          collectionSlug,
          data: {},
          docPermissions: collectionPermissions,
          docPreferences: null,
          operation: 'update',
          schemaPath: collectionSlug,
          signal: controller.signal,
        })

        setInitialState(result)
        hasInitializedState.current = true
      }

      void getInitialState()
    }

    return () => {
      abortAndIgnore(controller)
    }
  }, [
    apiRoute,
    hasInitializedState,
    serverURL,
    collectionSlug,
    getFormState,
    user,
    collectionPermissions,
  ])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      abortAndIgnore(formStateAbortControllerRef.current)

      const controller = new AbortController()
      formStateAbortControllerRef.current = controller

      const { state } = await getFormState({
        collectionSlug,
        docPermissions: collectionPermissions,
        docPreferences: null,
        formState: prevFormState,
        operation: 'update',
        schemaPath: collectionSlug,
        signal: controller.signal,
      })

      return state
    },
    [getFormState, collectionSlug, collectionPermissions],
  )

  useEffect(() => {
    return () => {
      abortAndIgnore(formStateAbortControllerRef.current)
    }
  }, [])

  const queryString = useMemo(() => {
    const queryWithSearch = mergeListSearchAndWhere({
      collectionConfig: collection,
      search: searchParams.get('search'),
    })

    return getQueryParams(queryWithSearch)
  }, [collection, searchParams, getQueryParams])

  const onSuccess = () => {
    router.replace(
      qs.stringify(
        {
          ...parseSearchParams(searchParams),
          page: selectAll === SelectAllStatus.AllAvailable ? '1' : undefined,
        },
        { addQueryPrefix: true },
      ),
    )
    clearRouteCache() // Use clearRouteCache instead of router.refresh, as we only need to clear the cache if the user has route caching enabled - clearRouteCache checks for this
    closeModal(drawerSlug)
  }

  if (selectAll === SelectAllStatus.None || !hasUpdatePermission) {
    return null
  }

  return (
    <div className={baseClass}>
      <DrawerToggler
        aria-label={t('general:edit')}
        className={`${baseClass}__toggle`}
        onClick={() => {
          setSelectedFields([])
        }}
        slug={drawerSlug}
      >
        {t('general:edit')}
      </DrawerToggler>
      <EditDepthProvider>
        <Drawer Header={null} slug={drawerSlug}>
          <DocumentInfoProvider
            collectionSlug={collectionSlug}
            currentEditor={user}
            hasPublishedDoc={false}
            id={null}
            initialData={{}}
            initialState={initialState}
            isLocked={false}
            lastUpdateTime={0}
            mostRecentVersionIsAutosaved={false}
            unpublishedVersionCount={0}
            versionCount={0}
          >
            <OperationContext.Provider value="update">
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
                    <XIcon />
                  </button>
                </div>
                <Form
                  className={`${baseClass}__form`}
                  initialState={initialState}
                  onChange={[onChange]}
                  onSuccess={onSuccess}
                >
                  <FieldSelect fields={fields} setSelected={setSelectedFields} />
                  {selectedFields.length === 0 ? null : (
                    <RenderFields
                      fields={fields}
                      filterFields={({ path }) =>
                        selectedFields.some(({ path: selectedPath }) => selectedPath === path)
                      }
                      parentIndexPath=""
                      parentPath=""
                      parentSchemaPath={collectionSlug}
                      permissions={collectionPermissions?.fields}
                      readOnly={false}
                    />
                  )}
                  <div className={`${baseClass}__sidebar-wrap`}>
                    <div className={`${baseClass}__sidebar`}>
                      <div className={`${baseClass}__sidebar-sticky-wrap`}>
                        <div className={`${baseClass}__document-actions`}>
                          {collection?.versions?.drafts ? (
                            <React.Fragment>
                              <SaveDraftButton
                                action={`${serverURL}${apiRoute}/${collectionSlug}${queryString}&draft=true`}
                                disabled={selectedFields.length === 0}
                                selectedFields={selectedFields}
                              />
                              <PublishButton
                                action={`${serverURL}${apiRoute}/${collectionSlug}${queryString}&draft=true`}
                                disabled={selectedFields.length === 0}
                                selectedFields={selectedFields}
                              />
                            </React.Fragment>
                          ) : (
                            <Submit
                              action={`${serverURL}${apiRoute}/${collectionSlug}${queryString}`}
                              disabled={selectedFields.length === 0}
                              selectedFields={selectedFields}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Form>
              </div>
            </OperationContext.Provider>
          </DocumentInfoProvider>
        </Drawer>
      </EditDepthProvider>
    </div>
  )
}
