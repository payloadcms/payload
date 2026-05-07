'use client'
import type { SanitizedCollectionConfig } from 'payload'

import { Modal, useModal } from '@faceless-ui/modal'
import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useForm } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { drawerZBase, useDrawerDepth } from '../Drawer/index.js'
import { PopupList } from '../Popup/index.js'
import './index.scss'

const baseClass = 'save-as-template'

export type Props = {
  readonly collectionSlug: string
  readonly singularLabel: SanitizedCollectionConfig['labels']['singular']
}

export const SaveAsTemplate: React.FC<Props> = ({ collectionSlug, singularLabel }) => {
  const { closeModal, isModalOpen, openModal } = useModal()
  const { getData } = useForm()
  const { i18n, t } = useTranslation()
  const editDepth = useDrawerDepth()

  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const modalSlug = `save-as-template-${collectionSlug}`

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

      setSubmitting(true)

      try {
        const data = getData()

        const response = await requests.post(
          formatAdminURL({
            apiRoute,
            path: `/payload-templates`,
          }),
          {
            body: JSON.stringify({
              data,
              description: description.trim() || undefined,
              entitySlug: collectionSlug,
              entityType: 'collection',
              title: title.trim(),
            }),
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/json',
              credentials: 'include',
            },
          },
        )

        const result = await response.json()

        if (response.status < 400) {
          toast.success(
            t('general:templateSaved', { name: title.trim() }) ||
              `${title.trim()} saved as a template.`,
          )
          setTitle('')
          setDescription('')
          closeModal(modalSlug)
        } else {
          toast.error(result?.errors?.[0]?.message || result?.message || 'Failed to save template')
        }
      } catch (_err) {
        toast.error('Failed to save template')
      }

      setSubmitting(false)
    },
    [
      apiRoute,
      closeModal,
      collectionSlug,
      description,
      getData,
      i18n.language,
      modalSlug,
      t,
      title,
    ],
  )

  return (
    <React.Fragment>
      <PopupList.Button
        id="action-save-as-template"
        onClick={() => {
          openModal(modalSlug)
        }}
      >
        {t('general:saveAsTemplate') || 'Save as Template'}
      </PopupList.Button>
      <Modal
        className={baseClass}
        slug={modalSlug}
        style={{
          zIndex: drawerZBase + editDepth,
        }}
      >
        {isModalOpen(modalSlug) ? (
          <form className={`${baseClass}__form`} onSubmit={onSubmit}>
            <h1>{t('general:saveAsTemplate') || 'Save as Template'}</h1>
            <p className={`${baseClass}__description`}>
              {`Save the current ${getTranslation(singularLabel, i18n)} as a reusable template.`}
            </p>
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
                id="save-as-template-cancel"
                onClick={onClose}
                size="medium"
                type="button"
              >
                {t('general:cancel')}
              </Button>
              <Button
                buttonStyle="primary"
                disabled={submitting || !title.trim()}
                id="save-as-template-confirm"
                size="medium"
                type="submit"
              >
                {submitting ? t('general:saving') : t('general:save')}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </React.Fragment>
  )
}
