'use client'

import type { SelectType, Where } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import {
  combineWhereConstraints,
  formatAdminURL,
  mergeListSearchAndWhere,
  unflatten,
} from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useMemo } from 'react'

import type { FieldOption } from '../FieldSelect/reduceFieldOptions.js'
import type { EditManyProps } from './index.js'

import { useForm } from '../../forms/Form/context.js'
import { Form } from '../../forms/Form/index.js'
import { RenderField } from '../../forms/RenderFields/RenderField.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { ChevronIcon } from '../../icons/Chevron/index.js'
import { useAuth } from '../../providers/Auth/index.js'
import { useBranchParam } from '../../providers/Branch/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { DocumentInfoProvider } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { OperationContext } from '../../providers/Operation/index.js'
import { useRouter, useSearchParams } from '../../providers/RouterAdapter/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { parseSearchParams } from '../../utilities/parseSearchParams.js'
import { Button } from '../Button/index.js'
import { FieldSelect } from '../FieldSelect/index.js'
import { baseClass } from './index.js'
import './index.css'
import '../../forms/RenderFields/index.css'

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
    <FormSubmit className={`${baseClass}__save`} disabled={disabled} onClick={save} size="medium">
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
    <FormSubmit
      className={`${baseClass}__publish`}
      disabled={disabled}
      onClick={save}
      size="medium"
    >
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
      size="medium"
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
  const currentLocale = useLocale()
  const locale = currentLocale?.code
  const branch = useBranchParam()

  const { closeModal } = useModal()

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const { i18n, t } = useTranslation()

  const router = useRouter()
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
        branch,
        locale,
        select: {},
        where: combineWhereConstraints(whereConstraints),
      },
      { addQueryPrefix: true },
    )
  }, [branch, collection, searchParams, selectAll, ids, locale, where])

  const onSuccess = () => {
    void router.replace(
      qs.stringify(
        {
          ...parseSearchParams(searchParams),
          _r: Date.now(), // Cache buster to force fresh data fetch. Prevents an e2e race condition where sometimes the data is not updated.
          page: selectAll ? '1' : undefined,
        },
        { addQueryPrefix: true },
      ),
    )
    closeModal(drawerSlug)

    if (typeof onSuccessFromProps === 'function') {
      onSuccessFromProps()
    }
  }

  const title = t('general:editingLabel', {
    count,
    label: getTranslation(count > 1 ? plural : singular, i18n),
  })

  return (
    <DocumentInfoProvider
      collectionSlug={collection.slug}
      currentEditor={user}
      docPermissions={collectionPermissions}
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
        <Form
          className={`${baseClass}__form`}
          onSuccess={onSuccess}
          schemaPath={collection.slug}
          select={select}
        >
          <div className={`${baseClass}__header`}>
            <Button
              aria-label={t('general:close')}
              buttonStyle="ghost"
              className={`${baseClass}__header__close`}
              icon={<ChevronIcon direction="left" size={24} />}
              onClick={() => closeModal(drawerSlug)}
            />
            <h2 className={`${baseClass}__header__title`} title={title}>
              {title}
            </h2>
            <div className={`${baseClass}__header__actions`}>
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
          <div className={`${baseClass}__body`}>
            <div className={`${baseClass}__select-fields`}>
              <FieldSelect
                fields={fields}
                onChange={setSelectedFields}
                permissions={collectionPermissions.fields}
              />
            </div>
            {selectedFields.length === 0 ? null : (
              <div className={`${baseClass}__edit`}>
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
              </div>
            )}
          </div>
        </Form>
      </OperationContext>
    </DocumentInfoProvider>
  )
}
