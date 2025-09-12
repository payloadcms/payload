'use client'
import { useModal } from '@faceless-ui/modal'
import React, { useCallback } from 'react'

import { useForm } from '../../forms/Form/context.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { revertDocument, unpublishDocument } from '../../utilities/documentActions.js'
import { Button } from '../Button/index.js'
import './index.scss'
import { ConfirmationModal } from '../ConfirmationModal/index.js'

const baseClass = 'status'

export const Status: React.FC = () => {
  const {
    id,
    collectionSlug,
    docPermissions,
    globalSlug,
    hasPublishedDoc,
    incrementVersionCount,
    isTrashed,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
  } = useDocumentInfo()

  const { toggleModal } = useModal()

  const {
    config: {
      routes: { api },
      serverURL,
    },
    getEntityConfig,
  } = useConfig()

  const { getData, reset: resetForm } = useForm()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation()

  const formData = getData()
  const unPublishModalSlug = `confirm-un-publish-${id}`
  const revertModalSlug = `confirm-revert-${id}`

  const [statusToRender, setStatusToRender] = React.useState<'changed' | 'draft' | 'published'>(
    'draft',
  )

  const collectionConfig = getEntityConfig({ collectionSlug })
  const globalConfig = getEntityConfig({ globalSlug })

  const docConfig = collectionConfig || globalConfig
  const autosaveEnabled =
    typeof docConfig?.versions?.drafts === 'object' ? docConfig.versions.drafts.autosave : false

  React.useEffect(() => {
    if (autosaveEnabled) {
      if (hasPublishedDoc) {
        setStatusToRender(unpublishedVersionCount > 0 ? 'changed' : 'published')
      }
    } else {
      setStatusToRender(formData._status || 'draft')
    }
  }, [autosaveEnabled, hasPublishedDoc, unpublishedVersionCount, formData._status])

  const displayStatusKey = isTrashed
    ? hasPublishedDoc
      ? 'previouslyPublished'
      : 'previouslyDraft'
    : statusToRender

  const performAction = useCallback(
    async (action: 'revert' | 'unpublish') => {
      const baseUrl = collectionSlug
        ? `${serverURL}${api}/${collectionSlug}/${id}`
        : globalSlug
          ? `${serverURL}${api}/globals/${globalSlug}`
          : ''

      if (action === 'unpublish') {
        await unpublishDocument({
          baseUrl,
          i18nLanguage: i18n.language,
          locale,
          resetForm,
          setMostRecentVersionIsAutosaved,
          setStatusToRender,
          t,
        })
      } else {
        await revertDocument({
          baseUrl,
          collectionSlug,
          globalSlug,
          i18nLanguage: i18n.language,
          incrementVersionCount,
          locale,
          resetForm,
          setHasPublishedDoc,
          setMostRecentVersionIsAutosaved,
          setUnpublishedVersionCount,
          t,
        })
      }
    },
    [
      api,
      collectionSlug,
      globalSlug,
      id,
      locale,
      serverURL,
      i18n.language,
      resetForm,
      incrementVersionCount,
      setUnpublishedVersionCount,
      setMostRecentVersionIsAutosaved,
      setHasPublishedDoc,
      t,
    ],
  )

  const canUpdate = docPermissions?.update

  if (statusToRender) {
    return (
      <div
        className={baseClass}
        title={`${t('version:status')}: ${t(`version:${displayStatusKey}`)}`}
      >
        <div className={`${baseClass}__value-wrap`}>
          <span className={`${baseClass}__label`}>{t('version:status')}:&nbsp;</span>
          <span className={`${baseClass}__value`}>{t(`version:${displayStatusKey}`)}</span>
          {!isTrashed && canUpdate && statusToRender === 'published' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="none"
                className={`${baseClass}__action`}
                id={`action-unpublish`}
                onClick={() => toggleModal(unPublishModalSlug)}
              >
                {t('version:unpublish')}
              </Button>
              <ConfirmationModal
                body={t('version:aboutToUnpublish')}
                confirmingLabel={t('version:unpublishing')}
                heading={t('version:confirmUnpublish')}
                modalSlug={unPublishModalSlug}
                onConfirm={() => performAction('unpublish')}
              />
            </React.Fragment>
          )}
          {!isTrashed && canUpdate && statusToRender === 'changed' && (
            <React.Fragment>
              &nbsp;&mdash;&nbsp;
              <Button
                buttonStyle="none"
                className={`${baseClass}__action`}
                id="action-revert-to-published"
                onClick={() => toggleModal(revertModalSlug)}
              >
                {t('version:revertToPublished')}
              </Button>
              <ConfirmationModal
                body={t('version:aboutToRevertToPublished')}
                confirmingLabel={t('version:reverting')}
                heading={t('version:confirmRevertToSaved')}
                modalSlug={revertModalSlug}
                onConfirm={() => performAction('revert')}
              />
            </React.Fragment>
          )}
        </div>
      </div>
    )
  }

  return null
}
