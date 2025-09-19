'use client'

import type { RelationshipFieldClientProps } from 'payload'

import {
  Pill,
  RelationshipField,
  useDocumentInfo,
  useField,
  useForm,
  useFormModified,
  useModal,
} from '@payloadcms/ui'
import React from 'react'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import {
  UpdateTenantFieldModal,
  updateTenantFieldModalSlug,
} from '../UpdateTenantFieldModal/index.client.js'
import './index.scss'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantField = ({ debug, unique, ...fieldArgs }: Props) => {
  const { entityType, options, selectedTenantID, setEntityType, setTenant } = useTenantSelection()
  const { setValue, showError, value } = useField<(number | string)[] | (number | string)>()
  const modified = useFormModified()
  const { setModified } = useForm()
  const { id: docID } = useDocumentInfo()
  const { openModal } = useModal()
  const prevModified = React.useRef(modified)
  const prevValue = React.useRef<typeof value>(value)
  const showField =
    (options.length > 1 && !fieldArgs.field.admin?.hidden && !fieldArgs.field.hidden) || debug

  const afterModalOpen = React.useCallback(() => {
    prevModified.current = modified
    prevValue.current = value
  }, [modified, value])

  const afterModalClose = React.useCallback(() => {
    let didChange = true
    // see if the values are actually different
    if (fieldArgs.field.hasMany) {
      const prev = (prevValue.current || []) as (number | string)[]
      const newValue = (value || []) as (number | string)[]
      if (prev.length !== newValue.length) {
        didChange = true
      } else {
        const allMatch = newValue.every((val) => prev.includes(val))
        if (allMatch) {
          didChange = false
        }
      }
    } else if (value === prevValue.current) {
      didChange = false
    }

    if (didChange) {
      prevModified.current = true
      prevValue.current = value
    }

    // reset the form value to what it was before opening the modal
    setValue(prevValue.current, true)
    // reset modified state to what it was before opening the modal
    setModified(prevModified.current)
  }, [setValue, setModified, value, fieldArgs.field.hasMany])

  React.useEffect(() => {
    if (!entityType) {
      setEntityType(unique ? 'global' : 'document')
    } else {
      // unique documents are controlled from the global TenantSelector
      if (!unique && value) {
        if (Array.isArray(value)) {
          if (value.length) {
            if (!selectedTenantID) {
              setTenant({ id: value[0], refresh: false })
            } else if (!value.includes(selectedTenantID)) {
              setTenant({ id: value[0], refresh: false })
            }
          }
        } else if (selectedTenantID !== value) {
          setTenant({ id: value, refresh: false })
        }
      }
    }

    return () => {
      if (entityType) {
        setEntityType(undefined)
      }
    }
  }, [unique, options, selectedTenantID, setTenant, value, setEntityType, entityType])

  React.useEffect(() => {
    if ((showError && showField) || (!value && !docID && !selectedTenantID)) {
      openModal(updateTenantFieldModalSlug)
    }
  }, [showError, showField, openModal, value, docID, selectedTenantID])

  if (showField) {
    if (debug) {
      /** Always show the field on create (for now) */
      return <CustomField debug={debug} fieldArgs={fieldArgs} unique={unique} />
    }

    if (!unique) {
      /** Editing a non-global tenant document */
      return (
        <UpdateTenantFieldModal afterModalClose={afterModalClose} afterModalOpen={afterModalOpen}>
          <CustomField
            debug={debug}
            fieldArgs={{
              ...fieldArgs,
              field: {
                ...fieldArgs.field,
              },
            }}
            unique={unique}
          />
        </UpdateTenantFieldModal>
      )
    }

    return <SyncFormModified />
  }

  return null
}

const CustomField: React.FC<{
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
