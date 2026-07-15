'use client'

import type { FieldType } from '@payloadcms/ui'
import type { RelationshipFieldClientProps } from 'payload'

import {
  FieldContext,
  FieldPathContext,
  Pill,
  RelationshipField,
  useDocumentInfo,
  useField,
  useForm,
  useFormModified,
  useModal,
} from '@payloadcms/ui'
import React from 'react'

import type { TenantValue } from '../../types.js'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import {
  AssignTenantFieldModal,
  assignTenantModalSlug,
} from '../AssignTenantFieldModal/index.client.js'
import './index.scss'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantField = ({ debug, unique, ...fieldArgs }: Props) => {
  const { entityType, options, selectedTenantID, setEntityType, setTenant } = useTenantSelection()
  const tenantField = useField<TenantValue>()
  const { setValue, showError, value } = tenantField
  const { isValid: isFormValid } = useForm()
  const { id: docID, collectionSlug } = useDocumentInfo()
  const { isModalOpen, openModal } = useModal()
  const isEditManyModalOpen = collectionSlug
    ? isModalOpen(`edit-${collectionSlug}`) || isModalOpen(`edit-${collectionSlug}-bulk-uploads`)
    : false
  const [modalValue, setModalValue] = React.useState<TenantValue | undefined>(value)
  const localTenantField = React.useMemo<FieldType<TenantValue>>(
    () => ({
      ...tenantField,
      initialValue: modalValue,
      setValue: (nextValue) => {
        setModalValue(nextValue as TenantValue | undefined)
      },
      value: modalValue as TenantValue,
    }),
    [modalValue, tenantField],
  )
  const showField =
    (options.length > 1 && !fieldArgs.field.admin?.hidden && !fieldArgs.field.hidden) || debug

  function getTenantIDToSelect({
    selectedTenantID,
    value,
  }: {
    selectedTenantID: number | string | undefined
    value: TenantValue | undefined
  }): number | string | undefined {
    if (Array.isArray(value)) {
      if (!value.length) {
        return undefined
      }

      if (!selectedTenantID || !value.includes(selectedTenantID)) {
        return value[0]
      }

      return undefined
    }

    if (value && selectedTenantID !== value) {
      return value
    }

    return undefined
  }

  const syncTenantSelectionFromValue = React.useCallback(
    (tenantValue: TenantValue | undefined) => {
      const tenantID = getTenantIDToSelect({ selectedTenantID, value: tenantValue })

      if (tenantID) {
        setTenant({ id: tenantID, refresh: false })
      }
    },
    [selectedTenantID, setTenant],
  )

  const onConfirm = React.useCallback(() => {
    if (hasTenantValueChanged({ hasMany: fieldArgs.field.hasMany, modalValue, value })) {
      setValue(modalValue)
      syncTenantSelectionFromValue(modalValue)
    }
  }, [fieldArgs.field.hasMany, modalValue, setValue, syncTenantSelectionFromValue, value])

  const afterModalOpen = React.useCallback(() => {
    setModalValue(value)
  }, [value])

  React.useEffect(() => {
    if (!entityType) {
      setEntityType(unique ? 'global' : 'document')
    } else {
      // unique documents are controlled from the global TenantSelector
      if (!unique) {
        syncTenantSelectionFromValue(value)
      }
    }

    return () => {
      if (entityType) {
        setEntityType(undefined)
      }
    }
  }, [entityType, setEntityType, syncTenantSelectionFromValue, unique, value])

  React.useEffect(() => {
    if (unique || debug || isEditManyModalOpen) {
      return
    }
    if (showField && ((!isFormValid && showError) || (!value && !selectedTenantID))) {
      openModal(assignTenantModalSlug)
    }
  }, [
    debug,
    isEditManyModalOpen,
    isFormValid,
    showError,
    showField,
    openModal,
    value,
    docID,
    selectedTenantID,
    unique,
  ])

  if (showField) {
    if (debug || isEditManyModalOpen) {
      return <TenantRelationshipField debug={debug} fieldArgs={fieldArgs} unique={unique} />
    }

    if (!unique) {
      /** Editing a non-global tenant document */
      return (
        <AssignTenantFieldModal
          afterModalClose={() => undefined}
          afterModalOpen={afterModalOpen}
          onConfirm={onConfirm}
        >
          <FieldPathContext value={tenantField.path}>
            <FieldContext value={localTenantField}>
              <TenantRelationshipField fieldArgs={fieldArgs} unique={unique} />
            </FieldContext>
          </FieldPathContext>
        </AssignTenantFieldModal>
      )
    }

    return <SyncFormModified />
  }

  return null
}

const hasTenantValueChanged = ({
  hasMany,
  modalValue,
  value,
}: {
  hasMany?: boolean
  modalValue: TenantValue | undefined
  value: TenantValue | undefined
}): boolean => {
  if (hasMany) {
    const currentValue = (value || []) as (number | string)[]
    const nextValue = (modalValue || []) as (number | string)[]

    return (
      currentValue.length !== nextValue.length ||
      nextValue.some((nextValueItem) => !currentValue.includes(nextValueItem))
    )
  }

  return value !== modalValue
}

const TenantRelationshipField: React.FC<{
  debug?: boolean
  fieldArgs: RelationshipFieldClientProps
  unique?: boolean
}> = ({ debug, fieldArgs, unique }) => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__wrapper`}>
        {debug && (
          <Pill className={`${baseClass}__debug-pill`} pillStyle="success" size="small">
            Multi-Tenant Debug Enabled
          </Pill>
        )}
        <RelationshipField
          {...fieldArgs}
          field={{
            ...fieldArgs.field,
            required: true,
          }}
          readOnly={fieldArgs.readOnly || fieldArgs.field.admin?.readOnly || unique}
        />
      </div>
    </div>
  )
}

/**
 * Tells the global selector when the form has been modified
 * so it can display the "Leave without saving" confirmation modal
 * if modified and attempting to change the tenant
 */
const SyncFormModified = () => {
  const modified = useFormModified()
  const { setModified } = useTenantSelection()

  React.useEffect(() => {
    setModified(modified)
  }, [modified, setModified])

  return null
}
