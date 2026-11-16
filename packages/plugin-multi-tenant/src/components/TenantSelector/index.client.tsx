'use client'
import type { ReactSelectOption } from '@payloadcms/ui'
import type { ViewTypes } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  ConfirmationModal,
  SelectInput,
  useConfig,
  useModal,
  useParams,
  useRouter,
  useSearchParams,
  useTranslation,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type {
  PluginMultiTenantTranslationKeys,
  PluginMultiTenantTranslations,
} from '../../translations/index.js'
import type { MultiTenantPluginConfig, TenantValue } from '../../types.js'

import { useTenantSelection } from '../../providers/TenantSelectionProvider/index.client.js'
import './index.css'

const confirmLeaveWithoutSavingSlug = 'confirm-leave-without-saving'

const baseClass = 'tenant-selector'

export const TenantSelectorClient = ({
  disabled: disabledFromProps,
  documentContext,
  label,
  viewType,
}: {
  disabled?: boolean
  documentContext?: { tenantValue?: TenantValue }
  label?: MultiTenantPluginConfig['tenantSelectorLabel']
  viewType?: ViewTypes
}) => {
  const {
    browsingTenantID,
    clearDocumentContext,
    entityType,
    modified,
    options,
    selectedTenantID,
    setDocumentContext,
    setTenant,
  } = useTenantSelection()
  const documentContextKey = React.useId()
  const { config } = useConfig()
  const { segments } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { closeModal, openModal } = useModal()
  const { i18n, t } = useTranslation<
    PluginMultiTenantTranslations,
    PluginMultiTenantTranslationKeys
  >()
  const [tenantSelection, setTenantSelection] = React.useState<
    ReactSelectOption | ReactSelectOption[]
  >()

  React.useEffect(() => {
    if (!documentContext) {
      return
    }

    const value = documentContext.tenantValue
    setDocumentContext({
      entityType: 'document',
      key: documentContextKey,
      tenantID: Array.isArray(value)
        ? (value.find((id) => id === browsingTenantID) ?? value[0])
        : (value ?? undefined),
    })

    return () => clearDocumentContext({ key: documentContextKey })
  }, [
    browsingTenantID,
    clearDocumentContext,
    documentContext,
    documentContextKey,
    setDocumentContext,
  ])

  const switchTenant = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[] | undefined) => {
      const isGlobal = entityType === 'global'

      setTenant({
        id: option && 'value' in option ? (option.value as number | string) : undefined,
        refresh: !isGlobal,
      })

      if (isGlobal && segments?.[0] === 'collections' && segments[1]) {
        const url = new URL(
          formatAdminURL({
            adminRoute: config.routes.admin,
            path: `/collections/${segments[1]}`,
          }),
          window.location.origin,
        )
        const locale = searchParams.get('locale')

        if (locale) {
          url.searchParams.set('locale', locale)
        }

        router.push(`${url.pathname}${url.search}`)
      }
    },
    [config.routes.admin, entityType, router, searchParams, segments, setTenant],
  )

  const onChange = React.useCallback(
    (option: ReactSelectOption | ReactSelectOption[]) => {
      if (
        option &&
        'value' in option &&
        option.value === selectedTenantID &&
        option.value === browsingTenantID
      ) {
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
    [browsingTenantID, selectedTenantID, entityType, modified, switchTenant, openModal],
  )

  if (options.length <= 1) {
    return null
  }

  return (
    <div className={baseClass}>
      <SelectInput
        className={`${baseClass}__select`}
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
