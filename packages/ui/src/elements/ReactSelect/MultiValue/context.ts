'use client'
import type { ButtonHTMLAttributes, RefCallback } from 'react'

import { createContext } from 'react'

export type MultiValueDragActivator = {
  ref?: RefCallback<HTMLElement>
} & ButtonHTMLAttributes<HTMLButtonElement>

export const MultiValueDragActivatorContext = createContext<MultiValueDragActivator | undefined>(
  undefined,
)
