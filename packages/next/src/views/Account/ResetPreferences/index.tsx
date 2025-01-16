'use client'
import type { User } from 'payload'

import { Button, LoadingOverlay, toast, useModal, useTranslation } from '@payloadcms/ui'
import * as qs from 'qs-esm'
import { Fragment, useCallback, useState } from 'react'

import { ConfirmResetModal } from './ConfirmResetModal/index.js'

const confirmResetModalSlug = 'confirm-reset-modal'

export const ResetPreferences: React.FC<{
  readonly apiRoute: string
  readonly user?: User
}> = ({ apiRoute, user }) => {
  const { openModal } = useModal()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(false)

  const handleResetPreferences = useCallback(async () => {
    if (!user || loading) {
      return
    }
    setLoading(true)

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
      const res = await fetch(`${apiRoute}/payload-preferences${stringifiedQuery}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      })

      const json = await res.json()
      const message = json.message

      if (res.ok) {
        toast.success(message)
      } else {
        toast.error(message)
      }
    } catch (e) {
      // swallow error
    } finally {
      setLoading(false)
    }
  }, [apiRoute, loading, user])

  return (
    <Fragment>
      <div>
        <Button buttonStyle="secondary" onClick={() => openModal(confirmResetModalSlug)}>
          {t('general:resetPreferences')}
        </Button>
      </div>
      <ConfirmResetModal onConfirm={handleResetPreferences} slug={confirmResetModalSlug} />
      {loading && <LoadingOverlay loadingText={t('general:resettingPreferences')} />}
    </Fragment>
  )
}
