import { useCallback, useEffect, useRef, useState } from 'react'

import { useConfig } from '../../utilities/Config'

export interface PopupMessage {
  searchParams: {
    [key: string]: string | undefined
    code: string
    installation_id: string
    state: string
  }
  type: string
}

export const usePopupWindow = (props: {
  eventType?: string
  href: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage?: (searchParams: PopupMessage['searchParams']) => Promise<void>
}): {
  closePopupWindow: () => void
  isPopupOpen: boolean
  openPopupWindow: (e: React.MouseEvent<HTMLAnchorElement>) => void
  popupRef?: React.MutableRefObject<Window | null>
} => {
  const { eventType, href, onMessage } = props
  const isReceivingMessage = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const { serverURL } = useConfig()
  const popupRef = useRef<Window | null>(null)

  useEffect(() => {
    const receiveMessage = async (event: MessageEvent): Promise<void> => {
      if (
        event.origin !== window.location.origin ||
        event.origin !== href ||
        event.origin !== serverURL
      ) {
        // console.warn(`Message received by ${event.origin}; IGNORED.`) // eslint-disable-line no-console
        return
      }

      if (
        typeof onMessage === 'function' &&
        event.data?.type === eventType &&
        !isReceivingMessage.current
      ) {
        isReceivingMessage.current = true
        await onMessage(event.data?.searchParams)
        isReceivingMessage.current = false
      }
    }

    window.addEventListener('message', receiveMessage, false)

    return () => {
      window.removeEventListener('message', receiveMessage)
    }
  }, [onMessage, eventType, href, serverURL])

  const openPopupWindow = useCallback(
    (e) => {
      e.preventDefault()

      const features = {
        height: 700,
        left: 'auto',
        menubar: 'no',
        popup: 'yes',
        toolbar: 'no',
        top: 'auto',
        width: 800,
      }

      const popupOptions = Object.entries(features)
        .reduce((str, [key, value]) => {
          let strCopy = str
          if (value === 'auto') {
            if (key === 'top') {
              const v = Math.round(window.innerHeight / 2 - features.height / 2)
              strCopy += `top=${v},`
            } else if (key === 'left') {
              const v = Math.round(window.innerWidth / 2 - features.width / 2)
              strCopy += `left=${v},`
            }
            return strCopy
          }

          strCopy += `${key}=${value},`
          return strCopy
        }, '')
        .slice(0, -1) // remove last ',' (comma)

      const newWindow = window.open(href, '_blank', popupOptions)
      popupRef.current = newWindow
      setIsOpen(true)
    },
    [href],
  )

  const closePopupWindow = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    closePopupWindow,
    isPopupOpen: isOpen,
    openPopupWindow,
    popupRef,
  }
}
