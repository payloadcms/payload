'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { ViewTypes } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { ConfirmationModal, SelectInput, useModal, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type {
  PluginMultiTenantTranslationKeys,
  PluginMultiTenantTranslations,
} from '../../translations/index.js'
import type { MultiTenantPluginConfig } from '../../types.js'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import './index.scss'

const confirmLeaveWithoutSavingSlug = 'confirm-leave-without-saving'

export const TenantSelectorClient = ({
  disabled: disabledFromProps,
  label,
  viewType,
}: {
  disabled?: boolean
  label?: MultiTenantPluginConfig['tenantSelectorLabel']
  viewType?: ViewTypes
}) => {
  const { entityType, modified, options, selectedTenantID, setTenant } = useTenantSelection()
  const { closeModal, openModal } = useModal()
  const { i18n, t } = useTranslation<
    PluginMultiTenantTranslations,
    PluginMultiTenantTranslationKeys
  >()
  const [tenantSelection, setTenantSelection] = React.useState<
    ReactSelectOption | ReactSelectOption[]
  >()

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

      if (entityType === 'global' && modified) {
        // If the entityType is 'global' and there are unsaved changes, prompt for confirmation
        setTenantSelection(option)
        openModal(confirmLeaveWithoutSavingSlug)
      } else {
        // If the entityType is not 'document', switch tenant without confirmation
        switchTenant(option)
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
        isClearable={['dashboard', 'list'].includes(viewType ?? '')}
        label={
          label ? getTranslation(label, i18n) : t('plugin-multi-tenant:nav-tenantSelector-label')
        }
        name="setTenant"
        onChange={onChange}
        options={options}
        path="setTenant"
        readOnly={
          disabledFromProps ||
          (entityType !== 'global' &&
            viewType &&
            (['document', 'version'] satisfies ViewTypes[] as ViewTypes[]).includes(viewType))
        }
        value={selectedTenantID as string | undefined}
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
