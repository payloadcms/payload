'use client'

import type { RelationshipFieldClientProps, StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  ConfirmationModal,
  RelationshipField,
  Translation,
  useField,
  useForm,
  useFormModified,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

import type {
  PluginMultiTenantTranslationKeys,
  PluginMultiTenantTranslations,
} from '../../translations/index.js'

import './index.scss'
import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'

const baseClass = 'tenantField'

type Props = {
  debug?: boolean
  unique?: boolean
} & RelationshipFieldClientProps

export const TenantField = (args: Props) => {
  const { entityType, options, selectedTenantID, setEntityType, setTenant } = useTenantSelection()
  const { value } = useField<number | string>()

  React.useEffect(() => {
    if (!entityType) {
      setEntityType(args.unique ? 'global' : 'document')
    } else {
      // unique documents are controlled from the global TenantSelector
      if (!args.unique && value) {
        if (!selectedTenantID || value !== selectedTenantID) {
          setTenant({ id: value, refresh: false })
        }
      }
    }

    return () => {
      if (entityType) {
        setEntityType(undefined)
      }
    }
  }, [args.unique, options, selectedTenantID, setTenant, value, setEntityType, entityType])

  if (options.length > 1 && !args.field.admin?.hidden && !args.field.hidden) {
    return (
      <>
        <div className={baseClass}>
          <div className={`${baseClass}__wrapper`}>
            <RelationshipField
              {...args}
              field={{
                ...args.field,
                required: true,
              }}
              readOnly={args.readOnly || args.field.admin?.readOnly || args.unique}
            />
          </div>
        </div>
        {args.unique ? (
          <SyncFormModified />
        ) : (
          <ConfirmTenantChange fieldLabel={args.field.label} fieldPath={args.path} />
        )}
      </>
    )
  }

  return null
}

const confirmSwitchTenantSlug = 'confirm-switch-tenant'

const ConfirmTenantChange = ({
  fieldLabel,
  fieldPath,
}: {
  fieldLabel?: StaticLabel
  fieldPath: string
}) => {
  const { options, selectedTenantID, setTenant } = useTenantSelection()
  const { setValue: setTenantFormValue, value: tenantFormValue } = useField<null | number | string>(
    { path: fieldPath },
  )
  const { setModified } = useForm()
  const modified = useFormModified()
  const { i18n, t } = useTranslation<
    PluginMultiTenantTranslations,
    PluginMultiTenantTranslationKeys
  >()
  const { isModalOpen, openModal } = useModal()

  const prevTenantValueRef = React.useRef<null | number | string>(tenantFormValue || null)
  const [tenantToConfirm, setTenantToConfirm] = React.useState<null | number | string>(
    tenantFormValue || null,
  )

  const fromTenantOption = React.useMemo(() => {
    if (tenantFormValue) {
      return options.find((option) => option.value === tenantFormValue)
    }
    return undefined
  }, [options, tenantFormValue])

  const toTenantOption = React.useMemo(() => {
    if (tenantToConfirm) {
      return options.find((option) => option.value === tenantToConfirm)
    }
    return undefined
  }, [options, tenantToConfirm])

  const modalIsOpen = isModalOpen(confirmSwitchTenantSlug)
  const testRef = React.useRef<boolean>(false)

  React.useEffect(() => {
    // the form value changed
    if (
      !modalIsOpen &&
      tenantFormValue &&
      prevTenantValueRef.current &&
      tenantFormValue !== prevTenantValueRef.current
    ) {
      // revert the form value change temporarily
      setTenantFormValue(prevTenantValueRef.current, true)
      // save the tenant to confirm in modal
      setTenantToConfirm(tenantFormValue)
      // open confirmation modal
      openModal(confirmSwitchTenantSlug)
    }
  }, [
    tenantFormValue,
    setTenantFormValue,
    openModal,
    setTenant,
    selectedTenantID,
    modalIsOpen,
    modified,
  ])

  return (
    <ConfirmationModal
      body={
        <Translation
          elements={{
            0: ({ children }) => {
              return <b>{children}</b>
            },
          }}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          i18nKey="plugin-multi-tenant:confirm-modal-tenant-switch--body"
          t={t}
          variables={{
            fromTenant: fromTenantOption?.label,
            toTenant: toTenantOption?.label,
          }}
        />
      }
      heading={t('plugin-multi-tenant:confirm-modal-tenant-switch--heading', {
        tenantLabel: fieldLabel
          ? getTranslation(fieldLabel, i18n)
          : t('plugin-multi-tenant:nav-tenantSelector-label'),
      })}
      modalSlug={confirmSwitchTenantSlug}
      onCancel={() => {
        setModified(testRef.current)
      }}
      onConfirm={() => {
        // set the form value to the tenant to confirm
        prevTenantValueRef.current = tenantToConfirm
        setTenantFormValue(tenantToConfirm)
      }}
    />
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
