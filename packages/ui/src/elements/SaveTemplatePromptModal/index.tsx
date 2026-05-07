'use client'
import { Modal, useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { drawerZBase, useDrawerDepth } from '../Drawer/index.js'
import './index.css'

const baseClass = 'save-template-prompt'

export type SaveTemplatePromptModalProps = {
  /** Heading shown at the top of the modal — e.g. "Save Block as Template". */
  readonly heading: string
  /** Faceless-ui modal slug. */
  readonly modalSlug: string
  /** Called after a successful save. */
  readonly onSaved?: (template: { id: number | string; title: string }) => void
  /** Provider for the data + entity descriptors at submit time. Returning `null`
   * cancels the save (e.g. nothing selected). */
  readonly resolveSaveArgs: () =>
    | {
        data: unknown
        entitySlug: string
        entityType: 'block' | 'field'
      }
    | null
    | undefined
}

export const SaveTemplatePromptModal: React.FC<SaveTemplatePromptModalProps> = ({
  heading,
  modalSlug,
  onSaved,
  resolveSaveArgs,
}) => {
  const { closeModal, isModalOpen } = useModal()
  const { i18n, t } = useTranslation()
  const editDepth = useDrawerDepth()

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onClose = useCallback(() => {
    if (submitting) {
      return
    }
    setTitle('')
    setDescription('')
    closeModal(modalSlug)
  }, [closeModal, modalSlug, submitting])

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (!title.trim()) {
        return
      }

      const args = resolveSaveArgs()
      if (!args) {
        toast.error('Nothing to save.')
        return
      }

      setSubmitting(true)

      try {
        const res = await requests.post(
          formatAdminURL({
            apiRoute,
            path: `/payload-templates`,
          }),
          {
            body: JSON.stringify({
              data: args.data,
              description: description.trim() || undefined,
              entitySlug: args.entitySlug,
              entityType: args.entityType,
              title: title.trim(),
            }),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
              credentials: 'include',
            },
          },
        )

        const json = await res.json()

        if (res.status < 400 && json?.doc) {
          toast.success(
            t('general:templateSaved', { name: title.trim() }) ||
              `${title.trim()} saved as a template.`,
          )
          onSaved?.({ id: json.doc.id, title: title.trim() })
          setTitle('')
          setDescription('')
          closeModal(modalSlug)
        } else {
          toast.error(json?.errors?.[0]?.message || json?.message || 'Failed to save template')
        }
      } catch (_err) {
        toast.error('Failed to save template')
      }

      setSubmitting(false)
    },
    [
      apiRoute,
      closeModal,
      description,
      i18n.language,
      modalSlug,
      onSaved,
      resolveSaveArgs,
      t,
      title,
    ],
  )

  return (
    <Modal className={baseClass} slug={modalSlug} style={{ zIndex: drawerZBase + editDepth }}>
      {isModalOpen(modalSlug) ? (
        <form className={`${baseClass}__form`} onSubmit={onSubmit}>
          <h2>{heading}</h2>
          <label className={`${baseClass}__label`}>
            {t('general:templateName') || 'Template Name'}
            <input
              aria-label={t('general:templateName') || 'Template Name'}
              className={`${baseClass}__input`}
              name="title"
              onChange={(e) => setTitle(e.target.value)}
              required
              type="text"
              value={title}
            />
          </label>
          <label className={`${baseClass}__label`}>
            Description
            <textarea
              aria-label="Description"
              className={`${baseClass}__textarea`}
              name="description"
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              value={description}
            />
          </label>
          <div className={`${baseClass}__actions`}>
            <Button
              buttonStyle="secondary"
              disabled={submitting}
              id={`${modalSlug}-cancel`}
              onClick={onClose}
              size="medium"
              type="button"
            >
              {t('general:cancel')}
            </Button>
            <Button
              buttonStyle="primary"
              disabled={submitting || !title.trim()}
              id={`${modalSlug}-confirm`}
              size="medium"
              type="submit"
            >
              {submitting ? t('general:saving') : t('general:save')}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
