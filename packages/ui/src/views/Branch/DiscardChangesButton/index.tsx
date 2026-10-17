'use client'

import { branchesCollectionSlug, formatAdminURL } from 'payload/shared'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../../../elements/Button/index.js'
import { ConfirmationModal } from '../../../elements/ConfirmationModal/index.js'
import { useModal } from '../../../elements/Modal/index.js'
import { useConfig } from '../../../providers/Config/index.js'
import { useRouter } from '../../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../../providers/RouteTransition/index.js'
import { useTranslation } from '../../../providers/Translation/index.js'
import { requests } from '../../../utilities/api.js'

/**
 * Throws away branch work, at the same scope the merge button applies it.
 *
 * Scoped by the same checkboxes deliberately: "these are the changes I am looking
 * at" should mean one thing on the page, whichever of the two actions follows. A
 * confirmation stands in front of it because discarding is the one action here that
 * destroys work rather than promoting it, and there is no undo.
 */
export const DiscardChangesButton: React.FC<{
  branchID: number | string
  /** Undefined means every pending change, matching the merge target's convention. */
  selectedChangeIDs?: (number | string)[]
  totalChanges: number
}> = ({ branchID, selectedChangeIDs, totalChanges }) => {
  const { t } = useTranslation()
  const { closeModal, openModal } = useModal()
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const [isDiscarding, setIsDiscarding] = useState(false)

  const modalSlug = `discard-branch-changes-${branchID}`
  const count = selectedChangeIDs?.length ?? totalChanges

  const handleDiscard = useCallback(async () => {
    setIsDiscarding(true)

    try {
      const response = await requests.post(
        formatAdminURL({
          apiRoute: api,
          path: `/${branchesCollectionSlug}/${branchID}/discard`,
          serverURL,
        }),
        {
          body: JSON.stringify({ changes: selectedChangeIDs }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.ok) {
        toast.error(t('error:unknown'))

        return
      }

      const json = (await response.json()) as { discarded?: unknown[] }

      toast.success(t('branching:discardedCount', { count: json.discarded?.length ?? 0 }))
      closeModal(modalSlug)
      startRouteTransition(() => router.refresh())
    } catch (_err) {
      toast.error(t('error:unknown'))
    } finally {
      setIsDiscarding(false)
    }
  }, [
    api,
    branchID,
    closeModal,
    modalSlug,
    router,
    selectedChangeIDs,
    serverURL,
    startRouteTransition,
    t,
  ])

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
        disabled={!count || isDiscarding}
        onClick={() => openModal(modalSlug)}
        size="medium"
      >
        {selectedChangeIDs
          ? t('branching:discardSelected', { count })
          : t('branching:discardAll', { count })}
      </Button>
      <ConfirmationModal
        body={
          selectedChangeIDs
            ? t('branching:confirmDiscardSelected', { count })
            : t('branching:confirmDiscardAll', { count })
        }
        className="discard-changes-modal"
        confirmingLabel={t('branching:discarding')}
        heading={t('branching:discardChanges')}
        modalSlug={modalSlug}
        onConfirm={handleDiscard}
      />
    </React.Fragment>
  )
}
