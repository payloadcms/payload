'use client'
import { toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { useEffect } from 'react'

type Props = {
  message: string
  redirectTo: string
}
export function ToastAndRedirect({ message, redirectTo }: Props) {
  const router = useRouter()
  const hasToastedRef = React.useRef(false)

  useEffect(() => {
    let timeoutID
    if (toast) {
      timeoutID = setTimeout(() => {
        toast.success(message)
        hasToastedRef.current = true
        router.push(redirectTo)
      }, 100)
    }

    return () => {
      if (timeoutID) {
        clearTimeout(timeoutID)
      }
    }
  }, [router, redirectTo, message])

  return null
}
