'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { useRouter } from 'next/navigation'

type UseClickableCardType<T extends HTMLElement> = {
  cardRef: RefObject<T | null>
  linkRef: RefObject<HTMLAnchorElement | null>
}

interface Props {
  external?: boolean
  newTab?: boolean
  scroll?: boolean
}

export const useClickableCard = <T extends HTMLElement>({
  external = false,
  newTab = false,
  scroll = true,
}: Props): UseClickableCardType<T> => {
  const router = useRouter()

  const cardRef = useRef<T>(null)
  const linkRef = useRef<HTMLAnchorElement>(null)

  const timeDown = useRef<number>(0)
  const hasActiveParent = useRef<boolean>(false)
  const pressedButton = useRef<number>(0)

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as Element | null
    const parent = target?.closest('a')

    pressedButton.current = e.button

    if (!parent) {
      hasActiveParent.current = false
      timeDown.current = +Date.now()
    } else {
      hasActiveParent.current = true
    }
  }, [])

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!linkRef.current?.href) return

      const difference = +Date.now() - timeDown.current

      if (difference <= 250) {
        if (!hasActiveParent.current && pressedButton.current === 0 && !e.ctrlKey) {
          if (external) {
            const target = newTab ? '_blank' : '_self'
            window.open(linkRef.current.href, target)
          } else {
            router.push(linkRef.current.href, { scroll })
          }
        }
      }
    },
    [router, external, newTab, scroll],
  )

  useEffect(() => {
    const cardNode = cardRef.current
    const abortController = new AbortController()

    if (cardNode) {
      cardNode.addEventListener('mousedown', handleMouseDown, {
        signal: abortController.signal,
      })
      cardNode.addEventListener('mouseup', handleMouseUp, {
        signal: abortController.signal,
      })
    }

    return () => abortController.abort()
  }, [handleMouseDown, handleMouseUp])

  return {
    cardRef,
    linkRef,
  }
}
