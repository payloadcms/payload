'use client'

import type { ClientCollectionConfig, FormState } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { FormProps } from '../../../forms/Form/index.js'
import type { State } from '../FormsManager/reducer.js'

import { Button } from '../../../elements/Button/index.js'
import { Form } from '../../../forms/Form/index.js'
import { RenderFields } from '../../../forms/RenderFields/index.js'
import { XIcon } from '../../../icons/X/index.js'
import { useAuth } from '../../../providers/Auth/index.js'
import { useServerFunctions } from '../../../providers/ServerFunctions/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { abortAndIgnore, handleAbortRef } from '../../../utilities/abortAndIgnore.js'
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

  const { getFormState } = useServerFunctions()

  const { permissions } = useAuth()
  const { i18n, t } = useTranslation()
  const { closeModal } = useModal()
  const { updateForm } = useFormsManager()

  const [selectedFields, setSelectedFields] = useState([])
  const [initialState, setInitialState] = useState<FormState>()
  const hasInitializedState = React.useRef(false)
  const abortOnChangeRef = useRef<AbortController>(null)
  const collectionPermissions = permissions?.collections?.[slug]

  useEffect(() => {
    const controller = new AbortController()

    if (!hasInitializedState.current) {
      const getInitialState = async () => {
        const { state: result } = await getFormState({
          collectionSlug: slug,
          data: {},
          docPermissions: collectionPermissions,
          docPreferences: null,
          operation: 'create',
          schemaPath: slug,
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
  }, [collectionPermissions, getFormState, slug])

  const onChange: FormProps['onChange'][0] = useCallback(
    async ({ formState: prevFormState }) => {
      const controller = handleAbortRef(abortOnChangeRef)

      const { state } = await getFormState({
        collectionSlug: slug,
        docPermissions: collectionPermissions,
        docPreferences: null,
        formState: prevFormState,
        operation: 'create',
        schemaPath: slug,
        signal: controller.signal,
      })

      abortOnChangeRef.current = null

      setInitialState(state)

      return state
    },
    [collectionPermissions, getFormState, slug],
  )

  const handleSave = useCallback(() => {
    if (!initialState) {
      return
    }

    forms.forEach((form, index) => {
      const updatedFormState = { ...form.formState }

      // Iterate over `initialState` to update the corresponding `formState`
      Object.entries(initialState).forEach(([path, field]) => {
        if (updatedFormState[path]) {
          updatedFormState[path] = {
            ...updatedFormState[path],
            errorMessage: undefined,
            valid: true,
            value: field.value,
          }
        }
      })

      // Push updated formState back to the FormsManager
      updateForm(index, updatedFormState)
    })

    closeModal(drawerSlug)
  }, [closeModal, drawerSlug, forms, initialState, updateForm])

  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current

    return () => {
      abortAndIgnore(abortOnChange)
    }
  }, [])

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
