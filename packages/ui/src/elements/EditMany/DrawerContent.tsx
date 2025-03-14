'use client'

import type { FieldWithPathClient, SelectType } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { unflatten } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo } from 'react'

import type { FormProps } from '../../forms/Form/index.js'

import { useForm } from '../../forms/Form/context.js'
import { Form } from '../../forms/Form/index.js'
import { RenderFields } from '../../forms/RenderFields/index.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js'
import { OperationContext } from '../../providers/Operation/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import { mergeListSearchAndWhere } from '../../utilities/mergeListSearchAndWhere.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { BulkEditFieldSelect } from './FieldSelect.js'
import { baseClass, type EditManyProps } from './index.js'
import './index.scss'

const Submit: React.FC<{
  readonly action: string
  readonly disabled: boolean
}> = ({ action, disabled }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    void submit({
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

const PublishButton: React.FC<{
  action: string
  disabled: boolean
}> = ({ action, disabled }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    void submit({
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

const SaveDraftButton: React.FC<{
  action: string
  disabled: boolean
}> = ({ action, disabled }) => {
  const { submit } = useForm()
  const { t } = useTranslation()

  const save = useCallback(() => {
    void submit({
      action,
      method: 'PATCH',
      overrides: {
        _status: 'draft',
      },
      skipValidation: true,
    })
  }, [action, submit])

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

export const EditManyDrawerContent: React.FC<
  {
    drawerSlug: string
    selected: FieldWithPathClient[]
    setSelected: React.Dispatch<React.SetStateAction<FieldWithPathClient[]>>
  } & EditManyProps
> = (props) => {
  const {
    collection: { slug, fields, labels: { plural, singular } } = {},
    collection,
    drawerSlug,
    selected,
    setSelected,
  } = props

  const select = useMemo<SelectType>(() => {
    return unflatten(
      selected.reduce((acc, field) => {
        acc[field.path] = true
        return acc
      }, {} as SelectType),
    )
  }, [selected])

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

  const router = useRouter()
  const abortFormStateRef = React.useRef<AbortController>(null)
  const { clearRouteCache } = useRouteCache()
  const collectionPermissions = permissions?.collections?.[slug]
  const searchParams = useSearchParams()

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const controller = handleAbortRef(abortFormStateRef)

      const { state } = await getFormState({
        collectionSlug: slug,
        docPermissions: collectionPermissions,
        docPreferences: null,
        formState: prevFormState,
        operation: 'update',
        schemaPath: slug,
        select,
        signal: controller.signal,
      })

      abortFormStateRef.current = null

      return state
    },
    [getFormState, slug, collectionPermissions, select],
  )

  useEffect(() => {
    const abortFormState = abortFormStateRef.current

    return () => {
      abortAndIgnore(abortFormState)
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

  return (
    <DocumentInfoProvider
      collectionSlug={slug}
      currentEditor={user}
      hasPublishedDoc={false}
      id={null}
      initialData={{}}
      isLocked={false}
      lastUpdateTime={0}
      mostRecentVersionIsAutosaved={false}
      unpublishedVersionCount={0}
      versionCount={0}
    >
      <OperationContext value="update">
        <div className={`${baseClass}__main`}>
          <div className={`${baseClass}__header`}>
            <h2 className={`${baseClass}__header__title`}>
              {t('general:editingLabel', {
                count,
                label: getTranslation(count > 1 ? plural : singular, i18n),
              })}
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
          <Form className={`${baseClass}__form`} onChange={[onChange]} onSuccess={onSuccess}>
            <BulkEditFieldSelect
              collectionPermissions={collectionPermissions}
              collectionSlug={slug}
              fields={fields}
              onChange={setSelected}
            />
            {selected.length === 0 ? null : (
              <RenderFields
                fields={selected}
                parentIndexPath=""
                parentPath=""
                parentSchemaPath={slug}
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
                          action={`${serverURL}${apiRoute}/${slug}${queryString}&draft=true`}
                          disabled={selected.length === 0}
                        />
                        <PublishButton
                          action={`${serverURL}${apiRoute}/${slug}${queryString}&draft=true`}
                          disabled={selected.length === 0}
                        />
                      </React.Fragment>
                    ) : (
                      <Submit
                        action={`${serverURL}${apiRoute}/${slug}${queryString}`}
                        disabled={selected.length === 0}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </OperationContext>
    </DocumentInfoProvider>
  )
}
