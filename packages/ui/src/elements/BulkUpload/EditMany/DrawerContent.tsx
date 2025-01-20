'use client'

import type { ClientCollectionConfig, FormState } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useState } from 'react'

import type { State } from '../FormsManager/reducer.js'

import { Button } from '../../../elements/Button/index.js'
import { Form } from '../../../forms/Form/index.js'
import { RenderFields } from '../../../forms/RenderFields/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { FieldSelect } from '../../FieldSelect/index.js'
import { useFormsManager } from '../FormsManager/index.js'
import { baseClass, type EditManyBulkUploadsProps } from './index.js'
import './index.scss'

export const EditManyBulkUploadsDrawerContent: React.FC<
  {
    collection: ClientCollectionConfig
    drawerSlug: string
    forms: State['forms']
  } & EditManyBulkUploadsProps
> = (props) => {
  const { collection: { slug, fields, labels: { plural } } = {}, drawerSlug, forms } = props
  const { permissions } = useAuth()
  const { i18n, t } = useTranslation()
  const { closeModal } = useModal()
  const { updateForm } = useFormsManager()
  const [selectedFields, setSelectedFields] = useState([])
  const [initialState, setInitialState] = useState<FormState>()
  const collectionPermissions = permissions?.collections?.[slug]

  // Build initial state from forms
  useEffect(() => {
    const state: FormState = {}

    forms.forEach((form, index) => {
      Object.entries(form.formState).forEach(([path, field]) => {
        // Namespace paths by index
        const namespacedPath = `${index}.${path}`
        state[namespacedPath] = {
          initialValue: field?.value,
          valid: field?.valid,
          value: field?.value,
        }
      })
    })

    setInitialState(state)
  }, [forms])

  const onChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async ({ formState }: { formState: FormState }): Promise<FormState> => {
      setInitialState((prevState) => {
        const updatedState = { ...prevState }

        Object.entries(formState).forEach(([path, field]) => {
          // If the path is namespaced (e.g., "0.title"), update it directly
          if (path.includes('.')) {
            updatedState[path] = {
              ...updatedState[path],
              ...field,
            }
          } else {
            // Spread the value to all indexed paths for the selected field
            Object.keys(prevState || {})
              .filter((key) => key.endsWith(`.${path}`)) // Match indexed keys like "0.title"
              .forEach((key) => {
                updatedState[key] = {
                  ...updatedState[key],
                  ...field,
                }
              })
          }
        })

        return updatedState
      })

      return formState
    },
    [],
  )

  // Handle saving changes to FormsManager
  const handleSave = useCallback(() => {
    forms.forEach((form, index) => {
      const updatedFormState = { ...form.formState }

      Object.entries(initialState || {})
        .filter(([path]) => path.startsWith(`${index}.`)) // Filter by index
        .forEach(([path, field]) => {
          const fieldPath = path.replace(`${index}.`, '') // Remove namespace
          updatedFormState[fieldPath] = {
            ...updatedFormState[fieldPath],
            value: field.value,
          }
        })

      updateForm(index, updatedFormState)
    })

    closeModal(drawerSlug)
  }, [forms, initialState, updateForm, closeModal, drawerSlug])

  return (
    <div className={`${baseClass}__main`}>
      <div className={`${baseClass}__header`}>
        <h2 className={`${baseClass}__header__title`}>
          {t('general:editingLabel', {
            count: forms.length,
            label: getTranslation(plural, i18n),
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
      <Form className={`${baseClass}__form`} initialState={initialState} onChange={[onChange]}>
        <FieldSelect fields={fields} setSelected={setSelectedFields} />
        {selectedFields.length === 0 ? null : (
          <RenderFields
            fields={selectedFields}
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
                <Button onClick={handleSave} type="button">
                  {t('general:applyChanges')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  )
}
