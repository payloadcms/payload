'use client'

import type { AriaAttributes, RefObject } from 'react'

import { useEffect, useId } from 'react'

export const useAriaSort = <TElement extends HTMLElement>({
  labelledBy,
  ref,
  value,
}: {
  labelledBy?: string
  ref: RefObject<null | TElement>
  value?: AriaAttributes['aria-sort']
}) => {
  const owner = useId()

  useEffect(() => {
    const header = ref.current?.closest('th')

    if (!header) {
      return
    }

    header.dataset.ariaSortOwner = owner
    if (value) {
      header.setAttribute('aria-sort', value)
    } else {
      header.removeAttribute('aria-sort')
    }
    if (labelledBy) {
      header.setAttribute('aria-labelledby', labelledBy)
    }

    return () => {
      if (header.dataset.ariaSortOwner === owner) {
        delete header.dataset.ariaSortOwner
        header.removeAttribute('aria-sort')
        if (labelledBy) {
          header.removeAttribute('aria-labelledby')
        }
      }
    }
  }, [labelledBy, owner, ref, value])
}
