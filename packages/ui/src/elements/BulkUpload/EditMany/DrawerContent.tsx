'use client'

import type { ClientCollectionConfig, SelectType } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { unflatten } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { FormProps } from '../../../forms/Form/index.js'
import type { OnFieldSelect } from '../../FieldSelect/index.js'
import type { FieldOption } from '../../FieldSelect/reduceFieldOptions.js'
import type { State } from '../FormsManager/reducer.js'

import { Button } from '../../../elements/Button/index.js'
import { Form } from '../../../forms/Form/index.js'
import { RenderField } from '../../../forms/RenderFields/RenderField.js'
import { XIcon } from '../../../icons/X/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { abortAndIgnore, handleAbortRef } from '../../../utilities/abortAndIgnore.js'
import { FieldSelect } from '../../FieldSelect/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { baseClass, type EditManyBulkUploadsProps } from './index.js'
import './index.scss'
import '../../../forms/RenderFields/index.scss'

export const EditManyBulkUploadsDrawerContent: React.FC<
  {
    collection: ClientCollectionConfig
    drawerSlug: string
    forms: State['forms']
  } & EditManyBulkUploadsProps
> = (props) => {
  const {
    collection: { fields, labels: { plural, singular } } = {},
    collection,
    drawerSlug,
    forms,
  } = props

  const [isInitializing, setIsInitializing] = useState(false)
  const { permissions } = useAuth()
  const { i18n, t } = useTranslation()
  const { closeModal } = useModal()
  const { bulkUpdateForm } = useFormsManager()
  const { getFormState } = useServerFunctions()
  const abortFormStateRef = React.useRef<AbortController>(null)

  const [selectedFields, setSelectedFields] = useState<FieldOption[]>([])
  const collectionPermissions = permissions?.collections?.[collection.slug]

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

  const handleSubmit: FormProps['onSubmit'] = useCallback(
    (formState) => {
      const pairedData = selectedFields.reduce((acc, option) => {
        if (formState[option.value.path]) {
          acc[option.value.path] = formState[option.value.path].value
        }
        return acc
      }, {})

      void bulkUpdateForm(pairedData, () => closeModal(drawerSlug))
    },
    [closeModal, drawerSlug, bulkUpdateForm, selectedFields],
  )

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
    [getFormState, collection, collectionPermissions],
  )

  return (
    <div className={`${baseClass}__main`}>
      <div className={`${baseClass}__header`}>
        <h2 className={`${baseClass}__header__title`}>
          {t('general:editingLabel', {
            count: forms.length,
            label: getTranslation(forms.length > 1 ? plural : singular, i18n),
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
        onSubmit={handleSubmit}
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
                <Button type="submit">{t('general:applyChanges')}</Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  )
}
