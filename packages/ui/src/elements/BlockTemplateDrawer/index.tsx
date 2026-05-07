'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { drawerZBase, useDrawerDepth } from '../Drawer/index.js'
import './index.css'

const baseClass = 'block-template-drawer'

type Template = {
  description?: null | string
  id: number | string
  title: string
}

export type BlockTemplateDrawerProps = {
  /** Block slugs allowed in the host blocks field — picker filters to these. */
  readonly allowedBlockSlugs: string[]
  /** Faceless-ui modal slug for this drawer. */
  readonly drawerSlug: string
  /** Slug of the host collection — used to scope drift detection at resolve time. */
  readonly hostCollectionSlug: string
  /** Dot-path of the host blocks field — used to scope drift detection. */
  readonly hostFieldPath: string
  /**
   * Called with the resolved block data when the user picks a template. The
   * host is responsible for inserting it into form state (e.g. via `addRow`).
   */
  readonly onSelect: (data: Record<string, unknown>) => Promise<void> | void
}

export const BlockTemplateDrawer: React.FC<BlockTemplateDrawerProps> = ({
  allowedBlockSlugs,
  drawerSlug,
  hostCollectionSlug,
  hostFieldPath,
  onSelect,
}) => {
  const { closeModal, isModalOpen } = useModal()
  const { i18n, t } = useTranslation()
  const editDepth = useDrawerDepth()

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const isOpen = isModalOpen(drawerSlug)

  const [templates, setTemplates] = useState<null | Template[]>(null)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState<null | string>(null)

  useEffect(() => {
    if (!isOpen) {
      setTemplates(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    void (async () => {
      try {
        const conditions = allowedBlockSlugs.map(
          (slug, idx) => `where[or][${idx}][entitySlug][equals]=${encodeURIComponent(slug)}`,
        )
        const url = formatAdminURL({
          apiRoute,
          path: `/payload-templates?where[entityType][equals]=block&where[_isStale][not_equals]=true&${conditions.join('&')}&limit=100&depth=0&sort=-updatedAt`,
        })

        const res = await fetch(url, {
          credentials: 'include',
          headers: { 'Accept-Language': i18n.language },
          signal: controller.signal,
        })

        const json = await res.json()
        if (!controller.signal.aborted) {
          setTemplates(json?.docs ?? [])
        }
      } catch (_err) {
        if (!controller.signal.aborted) {
          setTemplates([])
        }
      }

      if (!controller.signal.aborted) {
        setLoading(false)
      }
    })()

    return () => {
      controller.abort()
    }
  }, [allowedBlockSlugs, apiRoute, i18n.language, isOpen])

  const onPick = useCallback(
    async (templateID: number | string) => {
      if (resolving) {
        return
      }
      setResolving(String(templateID))

      try {
        const res = await requests.post(
          formatAdminURL({
            apiRoute,
            path: `/payload-templates/${encodeURIComponent(String(templateID))}/resolve`,
          }),
          {
            body: JSON.stringify({ hostCollectionSlug, hostFieldPath }),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
              credentials: 'include',
            },
          },
        )

        const json = await res.json()

        if (res.status < 400 && json?.data) {
          await onSelect(json.data as Record<string, unknown>)
          closeModal(drawerSlug)
        } else {
          toast.error(json?.errors?.[0]?.message || json?.message || 'Failed to apply template')
        }
      } catch (_err) {
        toast.error('Failed to apply template')
      }

      setResolving(null)
    },
    [
      apiRoute,
      closeModal,
      drawerSlug,
      hostCollectionSlug,
      hostFieldPath,
      i18n.language,
      onSelect,
      resolving,
    ],
  )

  return (
    <Modal className={baseClass} slug={drawerSlug} style={{ zIndex: drawerZBase + editDepth }}>
      {isOpen ? (
        <div className={`${baseClass}__panel`}>
          <header className={`${baseClass}__header`}>
            <h2>{t('general:chooseTemplate')}</h2>
          </header>
          {loading ? (
            <p className={`${baseClass}__empty`}>{t('general:loading')}</p>
          ) : !templates || templates.length === 0 ? (
            <p className={`${baseClass}__empty`}>
              No block templates yet. Save a block as a template to see it here.
            </p>
          ) : (
            <ul className={`${baseClass}__list`}>
              {templates.map((template) => (
                <li className={`${baseClass}__item`} key={template.id}>
                  <button
                    className={`${baseClass}__item-button`}
                    data-template-id={template.id}
                    disabled={resolving !== null}
                    onClick={() => {
                      void onPick(template.id)
                    }}
                    type="button"
                  >
                    <span className={`${baseClass}__item-title`}>{template.title}</span>
                    {template.description ? (
                      <span className={`${baseClass}__item-description`}>
                        {template.description}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={`${baseClass}__actions`}>
            <Button
              buttonStyle="secondary"
              disabled={resolving !== null}
              id="block-template-cancel"
              onClick={() => {
                closeModal(drawerSlug)
              }}
              size="medium"
              type="button"
            >
              {t('general:cancel')}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
