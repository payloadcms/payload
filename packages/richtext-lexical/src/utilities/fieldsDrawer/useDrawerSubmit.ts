'use client'
import type { FC } from 'react'
import type React from 'react'

import { useForm, useTranslation } from '@payloadcms/ui'
import { useEffect, useMemo, useRef } from 'react'

/**
 * Shared logic for drawers that render their submit button in the drawer header.
 *
 * The header's `onClick` is defined outside the `Form` provider, so it cannot call
 * `useForm().submit()` directly. This hook owns a ref to the form's `submit` function,
 * which is populated from inside the form via `<RegisterFormSubmit submitRef={submitRef} />`.
 *
 * Returns the `headerActions` array to spread onto a `Drawer` and the `submitRef`
 * to pass to `RegisterFormSubmit`.
 */
export const useDrawerSubmit = () => {
  const { t } = useTranslation()
  const submitRef = useRef<(() => void) | null>(null)

  const headerActions = useMemo(
    () => [
      {
        label: t('fields:saveChanges'),
        onClick: () => submitRef.current?.(),
        style: 'primary' as const,
      },
    ],
    [t],
  )

  return { headerActions, submitRef }
}

/**
 * Mounts inside a `<Form>` to populate `submitRef` (from `useDrawerSubmit`) with the form's
 * `submit` function, allowing drawer header actions rendered outside the form's React tree
 * to trigger submission.
 */
export const RegisterFormSubmit: FC<{
  submitRef: React.RefObject<(() => void) | null>
}> = ({ submitRef }) => {
  const { submit } = useForm()

  useEffect(() => {
    submitRef.current = () => void submit()
    return () => {
      submitRef.current = null
    }
  }, [submit, submitRef])

  return null
}
