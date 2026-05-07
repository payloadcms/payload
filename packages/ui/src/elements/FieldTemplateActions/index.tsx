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
import { useDrawerSlug } from '../Drawer/useDrawerSlug.js'
import { SaveTemplatePromptModal } from '../SaveTemplatePromptModal/index.js'
import './index.css'

const baseClass = 'field-template-actions'

type Template = {
  description?: null | string
  id: number | string
  title: string
}

export type FieldTemplateActionsProps = {
  /** Entity slug used to scope template queries — `<hostCollection>.<dotPath>`. */
  readonly entitySlug: string
  /** Slug of the host collection. */
  readonly hostCollectionSlug: string
  /** Dot-path of this field within the host doc (e.g. `'layout'`). */
  readonly hostFieldPath: string
  /** Called with resolved template data to replace the field's contents. */
  readonly onReplaceWithTemplate: (data: unknown[]) => Promise<void> | void
  /** Returns the current field value for the "Save as Template" action. */
  readonly resolveFieldValue: () => unknown
}

export const FieldTemplateActions: React.FC<FieldTemplateActionsProps> = ({
  entitySlug,
  hostCollectionSlug,
  hostFieldPath,
  onReplaceWithTemplate,
  resolveFieldValue,
}) => {
  const { closeModal, isModalOpen, openModal } = useModal()
  const { i18n, t } = useTranslation()
  const editDepth = useDrawerDepth()

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const drawerSlug = useDrawerSlug(`field-template-${hostFieldPath}`)
  const saveModalSlug = useDrawerSlug(`save-field-template-${hostFieldPath}`)
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
        const url = formatAdminURL({
          apiRoute,
          path: `/payload-templates?where[entityType][equals]=field&where[entitySlug][equals]=${encodeURIComponent(entitySlug)}&where[_isStale][not_equals]=true&limit=100&depth=0&sort=-updatedAt`,
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
  }, [apiRoute, entitySlug, i18n.language, isOpen])

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

        if (res.status < 400 && Array.isArray(json?.data)) {
          await onReplaceWithTemplate(json.data as unknown[])
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
      onReplaceWithTemplate,
      resolving,
    ],
  )

  return (
    <div className={baseClass}>
      <Button
        buttonStyle="secondary"
        className={`${baseClass}__save`}
        id={`field-${hostFieldPath}-save-as-template`}
        onClick={() => {
          openModal(saveModalSlug)
        }}
        size="medium"
        type="button"
      >
        {t('general:saveFieldAsTemplate')}
      </Button>
      <Button
        buttonStyle="secondary"
        className={`${baseClass}__replace`}
        id={`field-${hostFieldPath}-replace-from-template`}
        onClick={() => {
          openModal(drawerSlug)
        }}
        size="medium"
        type="button"
      >
        {t('general:replaceFromTemplate')}
      </Button>
      <SaveTemplatePromptModal
        heading={t('general:saveFieldAsTemplate')}
        modalSlug={saveModalSlug}
        resolveSaveArgs={() => {
          const value = resolveFieldValue()
          if (!Array.isArray(value) || value.length === 0) {
            return null
          }
          return {
            data: value,
            entitySlug,
            entityType: 'field',
          }
        }}
      />
      <Modal
        className={`${baseClass}__drawer`}
        slug={drawerSlug}
        style={{ zIndex: drawerZBase + editDepth }}
      >
        {isOpen ? (
          <div className={`${baseClass}__panel`}>
            <header className={`${baseClass}__header`}>
              <h2>{t('general:replaceFromTemplate')}</h2>
            </header>
            {loading ? (
              <p className={`${baseClass}__empty`}>{t('general:loading')}</p>
            ) : !templates || templates.length === 0 ? (
              <p className={`${baseClass}__empty`}>
                No field templates yet. Save this field as a template to see it here.
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
                id="field-template-cancel"
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
    </div>
  )
}
