'use client'
import type { ClientCollectionConfig } from 'payload'

import { Modal, useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../../providers/Config/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'
import { Button } from '../../Button/index.js'
import { drawerZBase, useDrawerDepth } from '../../Drawer/index.js'
import './CreateFromTemplateButton.scss'

const baseClass = 'list-create-from-template'

type Template = {
  description?: null | string
  id: number | string
  title: string
  updatedAt: string
}

export function CreateFromTemplateButton({
  collectionConfig,
}: {
  collectionConfig: ClientCollectionConfig
}) {
  const router = useRouter()
  const { closeModal, isModalOpen, openModal } = useModal()
  const { i18n, t } = useTranslation()
  const editDepth = useDrawerDepth()

  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()

  const modalSlug = `create-from-template-${collectionConfig.slug}`
  const isOpen = isModalOpen(modalSlug)

  const [templates, setTemplates] = useState<null | Template[]>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState<null | string>(null)

  useEffect(() => {
    if (!isOpen || templates !== null) {
      return
    }

    const controller = new AbortController()
    setLoading(true)

    void (async () => {
      try {
        const url = formatAdminURL({
          apiRoute,
          path: `/payload-templates?where[entityType][equals]=collection&where[entitySlug][equals]=${encodeURIComponent(
            collectionConfig.slug,
          )}&where[_isStale][not_equals]=true&limit=100&depth=0&sort=-updatedAt`,
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
  }, [apiRoute, collectionConfig.slug, i18n.language, isOpen, templates])

  const onClose = useCallback(() => {
    if (creating) {
      return
    }
    closeModal(modalSlug)
  }, [closeModal, creating, modalSlug])

  const onSelect = useCallback(
    async (templateID: number | string) => {
      if (creating) {
        return
      }

      setCreating(String(templateID))

      try {
        const res = await requests.post(
          formatAdminURL({
            apiRoute,
            path: `/${collectionConfig.slug}?templateID=${encodeURIComponent(String(templateID))}`,
          }),
          {
            body: JSON.stringify({}),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
              credentials: 'include',
            },
          },
        )

        const json = await res.json()

        if (res.status < 400 && json?.doc) {
          closeModal(modalSlug)
          router.push(
            formatAdminURL({
              adminRoute,
              path: `/collections/${collectionConfig.slug}/${json.doc.id}`,
            }),
          )
        } else {
          toast.error(
            json?.errors?.[0]?.message || json?.message || 'Failed to create from template',
          )
        }
      } catch (_err) {
        toast.error('Failed to create from template')
      }

      setCreating(null)
    },
    [
      adminRoute,
      apiRoute,
      closeModal,
      collectionConfig.slug,
      creating,
      i18n.language,
      modalSlug,
      router,
    ],
  )

  return (
    <React.Fragment>
      <Button
        aria-label={t('general:createFromTemplate')}
        buttonStyle="pill"
        className={`${baseClass}__button`}
        id="action-create-from-template"
        key="create-from-template-button"
        onClick={() => openModal(modalSlug)}
        size="medium"
      >
        {t('general:createFromTemplate')}
      </Button>
      <Modal className={baseClass} slug={modalSlug} style={{ zIndex: drawerZBase + editDepth }}>
        {isOpen ? (
          <div className={`${baseClass}__panel`}>
            <header className={`${baseClass}__header`}>
              <h1>{t('general:createFromTemplate')}</h1>
              <p className={`${baseClass}__subtitle`}>
                {`Pick a template for ${getTranslation(collectionConfig.labels.singular, i18n)}.`}
              </p>
            </header>
            {loading ? (
              <p className={`${baseClass}__empty`}>{t('general:loading')}</p>
            ) : !templates || templates.length === 0 ? (
              <p className={`${baseClass}__empty`}>
                No templates yet. Save a document as a template to see it here.
              </p>
            ) : (
              <ul className={`${baseClass}__list`}>
                {templates.map((template) => (
                  <li className={`${baseClass}__item`} key={template.id}>
                    <button
                      className={`${baseClass}__item-button`}
                      data-template-id={template.id}
                      disabled={creating !== null}
                      onClick={() => {
                        void onSelect(template.id)
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
                disabled={creating !== null}
                id="create-from-template-cancel"
                onClick={onClose}
                size="medium"
                type="button"
              >
                {t('general:cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </React.Fragment>
  )
}
