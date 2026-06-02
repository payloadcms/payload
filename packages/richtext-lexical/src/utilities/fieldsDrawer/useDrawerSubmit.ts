'use client'
import type { FC } from 'react'

import { useForm, useTranslation } from '@payloadcms/ui'
import { useCallback, useEffect, useMemo, useRef } from 'react'

/**
 * Shared logic for drawers that render their submit button in the drawer header.
 *
 * The header's `onClick` is defined outside the `Form` provider, so it cannot call
 * `useForm().submit()` directly. This hook owns a ref to the form's `submit` function,
 * which is wired up from inside the form via `<SubmitHandler registerSubmit={registerSubmit} />`.
 *
 * Returns the `headerActions` array to spread onto a `Drawer` and the `registerSubmit`
 * callback to pass to `SubmitHandler`.
 */
export const useDrawerSubmit = () => {
  const { t } = useTranslation()
  const submitFormRef = useRef<(() => void) | null>(null)

  const registerSubmit = useCallback((submit: () => void) => {
    submitFormRef.current = submit
  }, [])

  const headerActions = useMemo(
    () => [
      {
        label: t('fields:saveChanges'),
        onClick: () => submitFormRef.current?.(),
        style: 'primary' as const,
      },
    ],
    [t],
  )

  return { headerActions, registerSubmit }
}

/**
 * Registers the form's submit handler with a parent (via `useDrawerSubmit`) so a drawer
 * header action, rendered outside the form's React tree, can trigger submission.
 */
export const SubmitHandler: FC<{
  registerSubmit: (submit: () => void) => void
}> = ({ registerSubmit }) => {
  const { submit } = useForm()

  useEffect(() => {
    registerSubmit(() => {
      void submit()
    })
  }, [submit, registerSubmit])

  return null
}
