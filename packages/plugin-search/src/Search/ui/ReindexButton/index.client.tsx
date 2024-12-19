'use client'

import {
  LoadingOverlay,
  Popup,
  PopupList,
  toast,
  useLocale,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { useCallback, useMemo, useState } from 'react'

import type { ReindexButtonProps } from './types.js'

import { ReindexButtonLabel } from './ReindexButtonLabel/index.js'
import { ReindexConfirmModal } from './ReindexConfirmModal/index.js'

const confirmReindexModalSlug = 'confirm-reindex-modal'

export const ReindexButtonClient: React.FC<ReindexButtonProps> = ({
  collectionLabels,
  searchCollections,
  searchSlug,
}) => {
  const { closeModal, openModal } = useModal()
  const {
    i18n: { t },
  } = useTranslation()
  const locale = useLocale()
  const router = useRouter()

  const [reindexCollections, setReindexCollections] = useState<string[]>([])
  const [isLoading, setLoading] = useState<boolean>(false)

  const openConfirmModal = useCallback(() => openModal(confirmReindexModalSlug), [openModal])
  const closeConfirmModal = useCallback(() => closeModal(confirmReindexModalSlug), [closeModal])

  const handleReindexSubmit = useCallback(async () => {
    if (isLoading || !reindexCollections.length) {
      return
    }

    closeConfirmModal()
    setLoading(true)

    try {
      const endpointRes = await fetch(`/api/${searchSlug}/reindex?locale=${locale.code}`, {
        body: JSON.stringify({
          collections: reindexCollections,
        }),
        method: 'POST',
      })

      const { message } = (await endpointRes.json()) as { message: string }

      if (!endpointRes.ok) {
        toast.error(message)
      } else {
        toast.success(message)
        router.refresh()
      }
    } catch (err: unknown) {
      // swallow error, toast shown above
    } finally {
      setReindexCollections([])
      setLoading(false)
    }
  }, [closeConfirmModal, isLoading, reindexCollections, router, searchSlug, locale])

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
      <ReindexConfirmModal
        description={modalDescription}
        onCancel={closeConfirmModal}
        onConfirm={handleReindexSubmit}
        slug={confirmReindexModalSlug}
        title={modalTitle}
      />
      {isLoading && <LoadingOverlay loadingText={loadingText} />}
    </div>
  )
}
