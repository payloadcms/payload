'use client'

import type { SelectType, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter, useSearchParams } from 'next/navigation.js'
import {
  combineWhereConstraints,
  formatAdminURL,
  mergeListSearchAndWhere,
  unflatten,
} from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { FormProps } from '../../forms/Form/index.js'
import type { OnFieldSelect } from '../FieldSelect/index.js'
import type { FieldOption } from '../FieldSelect/reduceFieldOptions.js'

import { useForm } from '../../forms/Form/context.js'
import { Form } from '../../forms/Form/index.js'
import { RenderField } from '../../forms/RenderFields/RenderField.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { XIcon } from '../../icons/X/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { OperationContext } from '../../providers/Operation/index.js'
import { useRouteCache } from '../../providers/RouteCache/index.js'
import { useServerFunctions } from '../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { abortAndIgnore, handleAbortRef } from '../../utilities/abortAndIgnore.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { FieldSelect } from '../FieldSelect/index.js'
import './index.scss'
import '../../forms/RenderFields/index.scss'
import { baseClass, type EditManyProps } from './index.js'

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

type EditManyDrawerContentProps = {
  /**
   * The total count of selected items
   */
  count?: number
  /**
   * The slug of the drawer
   */
  drawerSlug: string
  /**
   * The IDs of the selected items
   */
  ids?: (number | string)[]
  /**
   * The function to call after a successful action
   */
  onSuccess?: () => void
  /**
   * Whether all items are selected
   */
  selectAll?: boolean
  /**
   * The fields that are selected to bulk edit
   */
  selectedFields: FieldOption[]
  /**
   * The function to set the selected fields to bulk edit
   */
  setSelectedFields: (fields: FieldOption[]) => void
  where?: Where
} & EditManyProps

export const EditManyDrawerContent: React.FC<EditManyDrawerContentProps> = (props) => {
  const {
    collection,
    collection: { fields, labels: { plural, singular } } = {},
    count,
    drawerSlug,
    ids,
    onSuccess: onSuccessFromProps,
    selectAll,
    selectedFields,
    setSelectedFields,
    where,
  } = props

  const { permissions, user } = useAuth()
  const { code: locale } = useLocale()

  const { closeModal } = useModal()

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const { getFormState } = useServerFunctions()

  const { i18n, t } = useTranslation()

  const [isInitializing, setIsInitializing] = useState(false)

  const router = useRouter()
  const abortFormStateRef = React.useRef<AbortController>(null)
  const { clearRouteCache } = useRouteCache()
  const collectionPermissions = permissions?.collections?.[collection.slug]
  const searchParams = useSearchParams()

  const select = useMemo<SelectType>(() => {
    return unflatten(
      selectedFields.reduce((acc, option) => {
        acc[option.value.path] = true
        return acc
      }, {} as SelectType),
    )
  }, [selectedFields])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(abortFormStateRef)

      const { state } = await getFormState({
        collectionSlug: collection.slug,
        docPermissions: collectionPermissions,
        docPreferences: null,
        formState: prevFormState,
        operation: 'update',
        schemaPath: collection.slug,
        select,
        signal: controller.signal,
        skipValidation: !submitted,
      })

      abortFormStateRef.current = null

      return state
    },
    [getFormState, collection, collectionPermissions, select],
  )

  useEffect(() => {
    const abortFormState = abortFormStateRef.current

    return () => {
      abortAndIgnore(abortFormState)
    }
  }, [])

  const queryString = useMemo((): string => {
    const whereConstraints: Where[] = []

    if (where) {
      whereConstraints.push(where)
    }

    const queryWithSearch = mergeListSearchAndWhere({
      collectionConfig: collection,
      search: searchParams.get('search'),
    })

    if (queryWithSearch) {
      whereConstraints.push(queryWithSearch)
    }

    if (selectAll) {
      // Match the current filter/search, or default to all docs
      whereConstraints.push(
        (parseSearchParams(searchParams)?.where as Where) || {
          id: {
            not_equals: '',
          },
        },
      )
    } else {
      // If we're not selecting all, we need to select specific docs
      whereConstraints.push({
        id: {
          in: ids || [],
        },
      })
    }

    return qs.stringify(
      {
        locale,
        select: {},
        where: combineWhereConstraints(whereConstraints),
      },
      { addQueryPrefix: true },
    )
  }, [collection, searchParams, selectAll, ids, locale, where])

  const onSuccess = () => {
    router.replace(
      qs.stringify(
        {
          ...parseSearchParams(searchParams),
          page: selectAll ? '1' : undefined,
        },
        { addQueryPrefix: true },
      ),
    )
    clearRouteCache()
    closeModal(drawerSlug)

    if (typeof onSuccessFromProps === 'function') {
      onSuccessFromProps()
    }
  }

  const onFieldSelect = useCallback<OnFieldSelect>(
    async ({ dispatchFields, formState, selected }) => {
      setIsInitializing(true)

      setSelectedFields(selected || [])

      const { state } = await getFormState({
        collectionSlug: collection.slug,
        docPermissions: collectionPermissions,
        docPreferences: null,
        formState,
        operation: 'update',
        schemaPath: collection.slug,
        select: unflatten(
          selected.reduce((acc, option) => {
            acc[option.value.path] = true
            return acc
          }, {} as SelectType),
        ),
        skipValidation: true,
      })

      dispatchFields({
        type: 'UPDATE_MANY',
        formState: state,
      })

      setIsInitializing(false)
    },
    [getFormState, collection.slug, collectionPermissions, setSelectedFields],
  )

  return (
    <DocumentInfoProvider
      collectionSlug={collection.slug}
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
          <Form
            className={`${baseClass}__form`}
            isInitializing={isInitializing}
            onChange={[onChange]}
            onSuccess={onSuccess}
          >
            <FieldSelect
              fields={fields}
              onChange={onFieldSelect}
              permissions={collectionPermissions.fields}
            />
            {selectedFields.length === 0 ? null : (
              <div className="render-fields">
                {selectedFields.map((option, i) => {
                  const {
                    value: { field, fieldPermissions, path },
                  } = option

                  return (
                    <RenderField
                      clientFieldConfig={field}
                      indexPath=""
                      key={`${path}-${i}`}
                      parentPath=""
                      parentSchemaPath=""
                      path={path}
                      permissions={fieldPermissions}
                    />
                  )
                })}
              </div>
            )}
            <div className={`${baseClass}__sidebar-wrap`}>
              <div className={`${baseClass}__sidebar`}>
                <div className={`${baseClass}__sidebar-sticky-wrap`}>
                  <div className={`${baseClass}__document-actions`}>
                    {collection?.versions?.drafts ? (
                      <React.Fragment>
                        <SaveDraftButton
                          action={formatAdminURL({
                            apiRoute,
                            path: `/${collection.slug}${queryString}&draft=true`,
                          })}
                          disabled={selectedFields.length === 0}
                        />
                        <PublishButton
                          action={formatAdminURL({
                            apiRoute,
                            path: `/${collection.slug}${queryString}&draft=true`,
                          })}
                          disabled={selectedFields.length === 0}
                        />
                      </React.Fragment>
                    ) : (
                      <Submit
                        action={formatAdminURL({
                          apiRoute,
                          path: `/${collection.slug}${queryString}`,
                        })}
                        disabled={selectedFields.length === 0}
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
