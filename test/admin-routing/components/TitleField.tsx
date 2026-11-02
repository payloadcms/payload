'use client'

import type { TextFieldClientProps } from 'payload'

import { TextField, useRouteTransition } from '@payloadcms/ui'
import React from 'react'

export const TitleField: React.FC<TextFieldClientProps> = (props) => {
  const { startRouteTransition } = useRouteTransition()
  const [transitionResult, setTransitionResult] = React.useState('')

  const runTransition = async () => {
    const transition = startRouteTransition(() => 42)
    const result = await transition

    setTransitionResult(
      transition instanceof Promise && result === undefined
        ? 'Transition complete'
        : 'Invalid transition result',
    )
  }

  return (
    <>
      <TextField {...props} />
      <button onClick={() => void runTransition()} type="button">
        Run synchronous transition
      </button>
      <output aria-label="Transition result">{transitionResult}</output>
    </>
  )
}
