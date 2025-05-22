'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { ViewTypes } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  ConfirmationModal,
  SelectInput,
  Translation,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import React from 'react'

import type {
  PluginMultiTenantTranslationKeys,
  PluginMultiTenantTranslations,
} from '../../translations/index.js'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import './index.scss'

const confirmSwitchTenantSlug = 'confirmSwitchTenant'

export const TenantSelector = ({ label, viewType }: { label: string; viewType?: ViewTypes }) => {
  const { options, preventRefreshOnChange, selectedTenantID, setTenant } = useTenantSelection()
  const { openModal } = useModal()
  const { i18n, t } = useTranslation<
    PluginMultiTenantTranslations,
    PluginMultiTenantTranslationKeys
  >()
  const [tenantSelection, setTenantSelection] = React.useState<
    ReactSelectOption | ReactSelectOption[]
  >()

  const selectedValue = React.useMemo(() => {
    if (selectedTenantID) {
      return options.find((option) => option.value === selectedTenantID)
    }
    return undefined
  }, [options, selectedTenantID])

  const newSelectedValue = React.useMemo(() => {
    if (tenantSelection && 'value' in tenantSelection) {
      return options.find((option) => option.value === tenantSelection.value)
    }
    return undefined
  }, [options, tenantSelection])

  const switchTenant = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[] | undefined) => {
      if (option && 'value' in option) {
        setTenant({ id: option.value as string, refresh: true })
      } else {
        setTenant({ id: undefined, refresh: true })
      }
    },
    [setTenant],
  )

  const onChange = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if (!preventRefreshOnChange) {
        switchTenant(option)
        return
      } else {
        setTenantSelection(option)
        openModal(confirmSwitchTenantSlug)
      }
    },
    [openModal, preventRefreshOnChange, switchTenant],
  )

  if (options.length <= 1) {
    return null
  }

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={viewType === 'list'}
        label={getTranslation(label, i18n)}
        name="setTenant"
        onChange={onChange}
        options={options}
        path="setTenant"
        value={selectedTenantID as string | undefined}
      />

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
            i18nKey="plugin-multi-tenant:confirm-tenant-switch--body"
            t={t}
            variables={{
              fromTenant: selectedValue?.label,
              toTenant: newSelectedValue?.label,
            }}
          />
        }
        heading={
          <Translation
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            i18nKey="plugin-multi-tenant:confirm-tenant-switch--heading"
            t={t}
            variables={{
              tenantLabel: getTranslation(label, i18n),
            }}
          />
        }
        modalSlug={confirmSwitchTenantSlug}
        onConfirm={() => {
          switchTenant(tenantSelection)
        }}
      />
    </div>
  )
}
