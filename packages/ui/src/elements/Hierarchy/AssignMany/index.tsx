'use client'

import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { SelectionWithPath } from '../Modal/types.js'

import { useConfig } from '../../../providers/Config/index.js'
import { useLocale } from '../../../providers/Locale/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import { ListSelectionButton } from '../../ListSelection/index.js'
import { useHierarchyModal } from '../Modal/useHierarchyModal.js'

type AssignManyProps = {
  currentParentID: null | number | string
  currentParentTitle?: string
  hierarchySlug: string
  Icon?: React.ReactNode
  onSuccess?: () => void
  requiredCollections?: string[]
  selections: Record<string, { ids: (number | string)[] }>
}

export function AssignMany({
  currentParentID,
  currentParentTitle,
  hierarchySlug,
  Icon,
  onSuccess,
  requiredCollections,
  selections,
}: AssignManyProps) {
  const { i18n, t } = useTranslation()
  const locale = useLocale()?.code
  const {
    config: {
      collections,
      routes: { api },
    },
  } = useConfig()
  const hierarchyCollection = collections.find((collection) => collection.slug === hierarchySlug)
  const hierarchyConfig =
    hierarchyCollection?.hierarchy && typeof hierarchyCollection.hierarchy === 'object'
      ? hierarchyCollection.hierarchy
      : undefined
  const hierarchyLabel =
    getTranslation(hierarchyCollection?.labels?.singular || hierarchySlug, i18n) || hierarchySlug
  const count = Object.values(selections).reduce((total, { ids }) => total + ids.length, 0)
  const isValidSelection = Object.keys(selections).every(
    (slug) => slug !== hierarchySlug && hierarchyConfig?.relatedCollections?.[slug]?.hasMany,
  )
  const [HierarchyModal, , { closeModal, openModal }] = useHierarchyModal({
    filterByCollection: requiredCollections,
    hierarchyCollectionSlug: hierarchySlug,
    Icon,
  })
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateMembership = useCallback(
    async ({ action, hierarchyID }: { action: 'add' | 'remove'; hierarchyID: number | string }) => {
      if (isSubmittingRef.current) {
        return
      }

      isSubmittingRef.current = true
      setIsSubmitting(true)

      let updatedCount = 0
      let hasErrors = false

      try {
        // A bulk PATCH replaces relationship arrays, so preserve each document's other memberships.
        for (const [collectionSlug, { ids }] of Object.entries(selections)) {
          const fieldName = hierarchyConfig?.relatedCollections?.[collectionSlug]?.fieldName

          if (!fieldName) {
            hasErrors = true
            toast.error(t('error:unknown'))
            continue
          }

          for (const id of ids) {
            try {
              const queryString = qs.stringify({ depth: 0, locale }, { addQueryPrefix: true })
              const url = formatAdminURL({
                apiRoute: api,
                path: `/${collectionSlug}/${encodeURIComponent(String(id))}${queryString}`,
              })
              const headers = { 'Accept-Language': i18n.language }
              const readResponse = await requests.get(url, { headers })

              if (!readResponse.ok) {
                throw new Error((await readResponse.json())?.message)
              }

              const document = await readResponse.json()
              const rawValues = document[fieldName]
              const isEmptyAtRoot =
                currentParentID === null && (rawValues === null || rawValues === undefined)

              if (!Array.isArray(rawValues) && !isEmptyAtRoot) {
                throw new Error(t('error:unknown'))
              }

              const values: (number | string)[] = (rawValues || []).map(
                (value: { id: number | string } | number | string) =>
                  typeof value === 'object' ? value.id : value,
              )
              const isAssigned = values.some((value) => String(value) === String(hierarchyID))

              if ((action === 'add' && isAssigned) || (action === 'remove' && !isAssigned)) {
                continue
              }

              const nextValues =
                action === 'add'
                  ? [...values, hierarchyID]
                  : values.filter((value) => String(value) !== String(hierarchyID))
              const updateResponse = await requests.patch(url, {
                body: JSON.stringify({ [fieldName]: nextValues }),
                headers: { ...headers, 'Content-Type': 'application/json' },
              })
              const result = await updateResponse.json()

              if (!updateResponse.ok || result?.errors?.length) {
                throw new Error(result?.message)
              }

              updatedCount++
            } catch (err) {
              hasErrors = true
              toast.error(err instanceof Error && err.message ? err.message : t('error:unknown'))
            }
          }
        }

        if (updatedCount > 0) {
          toast.success(
            t('general:updatedCountSuccessfully', {
              count: updatedCount,
              label: t(updatedCount === 1 ? 'general:document' : 'general:documents'),
            }),
          )
          onSuccess?.()
        }

        if (!hasErrors) {
          closeModal()
        }
      } finally {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      }
    },
    [
      api,
      closeModal,
      currentParentID,
      hierarchyConfig,
      i18n.language,
      locale,
      onSuccess,
      selections,
      t,
    ],
  )

  const handleModalSave = useCallback(
    ({ selections: selectedItems }: { selections: Map<number | string, SelectionWithPath> }) => {
      const selectedItem = selectedItems.values().next().value

      if (selectedItem) {
        void updateMembership({ action: 'add', hierarchyID: selectedItem.id })
      }
    },
    [updateMembership],
  )

  if (count === 0 || !isValidSelection) {
    return null
  }

  return (
    <React.Fragment>
      <ListSelectionButton disabled={isSubmitting} onClick={openModal}>
        {t('fields:addLabel', { label: hierarchyLabel })}
      </ListSelectionButton>
      {currentParentID !== null && (
        <ListSelectionButton
          disabled={isSubmitting}
          onClick={() => void updateMembership({ action: 'remove', hierarchyID: currentParentID })}
        >
          {t('hierarchy:removeFrom', { label: currentParentTitle || hierarchyLabel })}
        </ListSelectionButton>
      )}
      <HierarchyModal
        confirmLabel={t('general:confirm')}
        hasMany={false}
        isBusy={isSubmitting}
        onSave={handleModalSave}
        title={t('fields:addLabel', { label: hierarchyLabel })}
      />
    </React.Fragment>
  )
}
