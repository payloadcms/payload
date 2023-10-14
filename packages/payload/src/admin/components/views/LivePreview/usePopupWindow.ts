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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage?: (searchParams: PopupMessage['searchParams']) => Promise<void>
  url: string
}): {
  isPopupOpen: boolean
  openPopupWindow: () => void
  popupRef?: React.MutableRefObject<Window | null>
} => {
  const { eventType, onMessage, url } = props
  const isReceivingMessage = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const { serverURL } = useConfig()
  const popupRef = useRef<Window | null>(null)

  // Optionally broadcast messages back out to the parent component
  useEffect(() => {
    const receiveMessage = async (event: MessageEvent): Promise<void> => {
      if (
        event.origin !== window.location.origin ||
        event.origin !== url ||
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

    if (isOpen && popupRef.current) {
      window.addEventListener('message', receiveMessage, false)
    }

    return () => {
      window.removeEventListener('message', receiveMessage)
    }
  }, [onMessage, eventType, url, serverURL, isOpen])

  // Customize the size, position, and style of the popup window
  const openPopupWindow = useCallback(() => {
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

    const newWindow = window.open(url, '_blank', popupOptions)

    popupRef.current = newWindow

    setIsOpen(true)
  }, [url])

  // this is the most stable and widely supported way to check if a popup window is no longer open
  // we poll its ref every x ms and use the popup window's `closed` property
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isOpen) {
      timer = setInterval(function () {
        if (popupRef.current.closed) {
          clearInterval(timer)
          setIsOpen(false)
        }
      }, 1000)
    } else {
      clearInterval(timer)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [isOpen, popupRef])

  return {
    isPopupOpen: isOpen,
    openPopupWindow,
    popupRef,
  }
}
