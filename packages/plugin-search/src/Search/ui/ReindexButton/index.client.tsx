'use client'

import type { OnConfirm } from '@payloadcms/ui'

import {
  ConfirmationModal,
  Popup,
  PopupList,
  toast,
  useConfig,
  useLocale,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { useCallback, useMemo, useState } from 'react'

import type { ReindexButtonProps } from './types.js'

import { ReindexButtonLabel } from './ReindexButtonLabel/index.js'

const confirmReindexModalSlug = 'confirm-reindex-modal'

export const ReindexButtonClient: React.FC<ReindexButtonProps> = ({
  collectionLabels,
  searchCollections,
  searchSlug,
}) => {
  const { closeModal, openModal } = useModal()

  const { config } = useConfig()

  const {
    i18n: { t },
  } = useTranslation()

  const locale = useLocale()
  const router = useRouter()

  const [reindexCollections, setReindexCollections] = useState<string[]>([])

  const openConfirmModal = useCallback(() => openModal(confirmReindexModalSlug), [openModal])

  const handleReindexSubmit: OnConfirm = useCallback(
    async ({ closeConfirmationModal, setConfirming }) => {
      if (!reindexCollections.length) {
        setConfirming(false)
        closeConfirmationModal()
        return
      }

      try {
        const res = await fetch(
          `${config.routes.api}/${searchSlug}/reindex?locale=${locale.code}`,
          {
            body: JSON.stringify({
              collections: reindexCollections,
            }),
            method: 'POST',
          },
        )

        setConfirming(false)
        closeConfirmationModal()

        const { message } = (await res.json()) as { message: string }

        if (!res.ok) {
          toast.error(message)
        } else {
          toast.success(message)
          router.refresh()
        }
      } catch (_err: unknown) {
        // swallow error, toast shown above
      } finally {
        setConfirming(false)
        closeConfirmationModal()
        setReindexCollections([])
      }
    },
    [reindexCollections, router, searchSlug, locale, config],
  )

  const handleShowConfirmModal = useCallback(
    (collections: string | string[] = searchCollections) => {
      setReindexCollections(typeof collections === 'string' ? [collections] : collections)
      openConfirmModal()
    },
    [openConfirmModal, searchCollections],
  )

  const handlePopupButtonClick = useCallback(
    (closePopup: () => void, slug?: string) => {
      closePopup()
      handleShowConfirmModal(slug)
    },
    [handleShowConfirmModal],
  )

  const getPluralizedLabel = useCallback(
    (slug: string) => {
      const label = collectionLabels[slug]
      if (typeof label === 'string') {
        return label
      } else {
        return Object.hasOwn(label, locale.code) ? label[locale.code] : slug
      }
    },
    [collectionLabels, locale.code],
  )

  const pluralizedLabels = useMemo(() => {
    return searchCollections.reduce<Record<string, string>>((acc, slug) => {
      acc[slug] = getPluralizedLabel(slug)
      return acc
    }, {})
  }, [searchCollections, getPluralizedLabel])

  const selectedAll = reindexCollections.length === searchCollections.length
  const selectedLabels = reindexCollections.map((slug) => pluralizedLabels[slug]).join(', ')

  const modalTitle = selectedAll
    ? t('general:confirmReindexAll')
    : t('general:confirmReindex', { collections: selectedLabels })
  const modalDescription = selectedAll
    ? t('general:confirmReindexDescriptionAll')
    : t('general:confirmReindexDescription', { collections: selectedLabels })
  const loadingText = selectedAll
    ? t('general:reindexingAll', { collections: t('general:collections') })
    : t('general:reindexingAll', { collections: selectedLabels })

  return (
    <div>
      <Popup
        button={<ReindexButtonLabel />}
        render={({ close }) => (
          <PopupList.ButtonGroup>
            {searchCollections.map((collectionSlug) => (
              <PopupList.Button
                key={collectionSlug}
                onClick={() => handlePopupButtonClick(close, collectionSlug)}
              >
                {pluralizedLabels[collectionSlug]}
              </PopupList.Button>
            ))}
            <PopupList.Button onClick={() => handlePopupButtonClick(close)}>
              {t('general:allCollections')}
            </PopupList.Button>
          </PopupList.ButtonGroup>
        )}
        showScrollbar
        size="large"
        verticalAlign="bottom"
      />
      <ConfirmationModal
        body={modalDescription}
        heading={modalTitle}
        modalSlug={confirmReindexModalSlug}
        onConfirm={handleReindexSubmit}
      />
    </div>
  )
}
