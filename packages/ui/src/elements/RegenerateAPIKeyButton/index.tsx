'use client'
import type { UIFieldClientComponent } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { useField } from '../../forms/useField/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { Button } from '../Button/index.js'
import { ConfirmationModal } from '../ConfirmationModal/index.js'
import { Translation } from '../Translation/index.js'

/**
 * Issues a fresh secret for an existing `payload-api-keys` document, replacing the
 * one-way `apiKeyHash` server-side - the previous secret stops working immediately.
 * Since the secret is never stored in a form the server can show again, this is the only
 * way to get a usable value for a key after its one-time reveal at creation, mirroring
 * how a lost password is reset rather than looked up.
 *
 * Renders nothing for a not-yet-created document (nothing to regenerate) or when the
 * viewer lacks update access to this document (regeneration is owner-only, matching
 * create/rename - an administrator with `manageOthers` access can revoke another owner's
 * key but never mint a new one on their behalf).
 */
export const RegenerateAPIKeyButton: UIFieldClientComponent = ({ readOnly }) => {
  const { id, updateSavedDocumentData } = useDocumentInfo()
  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()
  const { i18n, t } = useTranslation()
  const { closeModal, toggleModal } = useModal()
  const { setValue } = useField<string>({ path: 'apiKey' })

  const modalSlug = `regenerate-api-key-${id}`

  const handleRegenerate = useCallback(async () => {
    try {
      const res = await requests.patch(
        formatAdminURL({ apiRoute, path: `/payload-api-keys/${id}`, serverURL }),
        {
          body: JSON.stringify({ regenerate: true }),
          headers: {
            'Accept-Language': i18n.language,
            'Content-Type': 'application/json',
          },
        },
      )

      const { doc, errors, message } = await res.json()

      if (res.status < 400 && doc?.apiKey) {
        setValue(doc.apiKey)
        // Regeneration happens outside the normal form save flow, so the document-info
        // context's own record of "what's currently saved" needs updating directly -
        // otherwise its staleness check sees a server updatedAt it didn't cause and warns
        // that someone else modified the document.
        updateSavedDocumentData(doc)
        toast.success(t('authentication:newAPIKeyGenerated'))
      } else {
        toast.error(errors?.[0]?.message || message || t('error:unspecific'))
      }
    } catch (_error) {
      toast.error(t('error:unspecific'))
    } finally {
      closeModal(modalSlug)
    }
  }, [
    apiRoute,
    closeModal,
    i18n.language,
    id,
    modalSlug,
    serverURL,
    setValue,
    t,
    updateSavedDocumentData,
  ])

  if (!id || readOnly) {
    return null
  }

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
        onClick={() => toggleModal(modalSlug)}
        size="medium"
        type="button"
      >
        {t('authentication:generateNewAPIKey')}
      </Button>
      <ConfirmationModal
        body={
          <Translation
            elements={{
              1: ({ children }) => <strong>{children}</strong>,
            }}
            i18nKey="authentication:generatingNewAPIKeyWillInvalidate"
            t={t}
          />
        }
        confirmLabel={t('authentication:generate')}
        heading={t('authentication:confirmGeneration')}
        modalSlug={modalSlug}
        onConfirm={handleRegenerate}
      />
    </React.Fragment>
  )
}
