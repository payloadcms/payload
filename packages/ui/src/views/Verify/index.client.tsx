'use client'
import React, { useEffect } from 'react'
import { toast } from 'sonner'

import { Link } from '../../elements/Link/index.js'
import { Translation } from '../../elements/Translation/index.js'
import { useRouter } from '../../providers/RouterAdapter/index.js'
import { useRouteTransition } from '../../providers/RouteTransition/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const baseClass = 'verify'

const redirectDelay = 3000

type Props = {
  message: string
  redirectTo: string
}
export function ToastAndRedirect({ message, redirectTo }: Props) {
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const hasToastedRef = React.useRef(false)

  useEffect(() => {
    let timeoutID

    if (toast) {
      timeoutID = setTimeout(() => {
        toast.success(message)
        hasToastedRef.current = true
        startRouteTransition(() => router.push(redirectTo))
      }, 100)
    }

    return () => {
      if (timeoutID) {
        clearTimeout(timeoutID)
      }
    }
  }, [router, redirectTo, message, startRouteTransition])

  return null
}

export function VerifyClient({ loginRoute }: { loginRoute: string }) {
  const router = useRouter()
  const { startRouteTransition } = useRouteTransition()
  const { t } = useTranslation()

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      startRouteTransition(() => router.push(loginRoute))
    }, redirectDelay)

    return () => {
      clearTimeout(timeoutID)
    }
  }, [router, loginRoute, startRouteTransition])

  return (
    <div className={`${baseClass}__content`}>
      <p>{t('authentication:emailVerifiedRedirecting')}</p>
      <p>
        <Translation
          elements={{
            0: ({ children }) => (
              <Link href={loginRoute} prefetch={false}>
                {children}
              </Link>
            ),
          }}
          i18nKey="authentication:notRedirected"
          t={t}
        />
      </p>
    </div>
  )
}
