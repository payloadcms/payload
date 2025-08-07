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

const confirmSwitchTenantSlug = 'confirm-switch-tenant'
const confirmLeaveWithoutSavingSlug = 'confirm-leave-without-saving'

export const TenantSelector = ({ label, viewType }: { label: string; viewType?: ViewTypes }) => {
  const { entityType, modified, options, selectedTenantID, setTenant } = useTenantSelection()
  const { closeModal, openModal } = useModal()
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
      if (option && 'value' in option && option.value === selectedTenantID) {
        // If the selected option is the same as the current tenant, do nothing
        return
      }

      if (entityType !== 'document') {
        if (entityType === 'global' && modified) {
          // If the entityType is 'global' and there are unsaved changes, prompt for confirmation
          setTenantSelection(option)
          openModal(confirmLeaveWithoutSavingSlug)
        } else {
          // If the entityType is not 'document', switch tenant without confirmation
          switchTenant(option)
        }
      } else {
        // non-unique documents should always prompt for confirmation
        setTenantSelection(option)
        openModal(confirmSwitchTenantSlug)
      }
    },
    [selectedTenantID, entityType, modified, switchTenant, openModal],
  )

  if (options.length <= 1) {
    return null
  }

  return (
    <div className="tenant-selector">
      <SelectInput
        isClearable={viewType === 'list'}
        label={
          label ? getTranslation(label, i18n) : t('plugin-multi-tenant:nav-tenantSelector-label')
        }
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
            i18nKey="plugin-multi-tenant:confirm-modal-tenant-switch--body"
            t={t}
            variables={{
              fromTenant: selectedValue?.label,
              toTenant: newSelectedValue?.label,
            }}
          />
        }
        heading={t('plugin-multi-tenant:confirm-modal-tenant-switch--heading', {
          tenantLabel: label
            ? getTranslation(label, i18n)
            : t('plugin-multi-tenant:nav-tenantSelector-label'),
        })}
        modalSlug={confirmSwitchTenantSlug}
        onConfirm={() => {
          switchTenant(tenantSelection)
        }}
      />

      <ConfirmationModal
        body={t('general:changesNotSaved')}
        cancelLabel={t('general:stayOnThisPage')}
        confirmLabel={t('general:leaveAnyway')}
        heading={t('general:leaveWithoutSaving')}
        modalSlug={confirmLeaveWithoutSavingSlug}
        onCancel={() => {
          closeModal(confirmLeaveWithoutSavingSlug)
        }}
        onConfirm={() => {
          switchTenant(tenantSelection)
        }}
      />
    </div>
  )
}
