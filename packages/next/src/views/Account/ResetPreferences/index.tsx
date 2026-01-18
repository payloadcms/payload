'use client'
import type { TypedUser } from '@ruya.sa/payload'

import {
  Button,
  ConfirmationModal,
  toast,
  useConfig,
  useModal,
  useTranslation,
} from '@ruya.sa/ui'
import { formatAdminURL } from '@ruya.sa/payload/shared'
import * as qs from 'qs-esm'
import { Fragment, useCallback } from 'react'

const confirmResetModalSlug = 'confirm-reset-modal'

export const ResetPreferences: React.FC<{
  readonly user?: TypedUser
}> = ({ user }) => {
  const { openModal } = useModal()
  const { t } = useTranslation()
  const {
    config: {
      routes: { api: apiRoute },
    },
  } = useConfig()

  const handleResetPreferences = useCallback(async () => {
    if (!user) {
      return
    }

    const stringifiedQuery = qs.stringify(
      {
        depth: 0,
        where: {
          user: {
            id: {
              equals: user.id,
            },
          },
        },
      },
      { addQueryPrefix: true },
    )

    try {
      const res = await fetch(
        formatAdminURL({
          apiRoute,
          path: `/payload-preferences${stringifiedQuery}`,
        }),
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        },
      )

      const json = await res.json()
      const message = json.message

      if (res.ok) {
        toast.success(message)
      } else {
        toast.error(message)
      }
    } catch (_err) {
      // swallow error
    }
  }, [apiRoute, user])

  return (
    <Fragment>
      <div>
        <Button buttonStyle="secondary" onClick={() => openModal(confirmResetModalSlug)}>
          {t('general:resetPreferences')}
        </Button>
      </div>
      <ConfirmationModal
        body={t('general:resetPreferencesDescription')}
        confirmingLabel={t('general:resettingPreferences')}
        heading={t('general:resetPreferences')}
        modalSlug={confirmResetModalSlug}
        onConfirm={handleResetPreferences}
      />
    </Fragment>
  )
}
