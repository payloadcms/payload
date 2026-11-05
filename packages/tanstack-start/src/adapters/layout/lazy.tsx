'use client'
import type { ServerFunctionClient } from 'payload'

import { useLoaderData } from '@tanstack/react-router'
import React, { useDeferredValue } from 'react'

import type { LoadLayoutDataResult } from './server.js'

import { ServerFunctionContext } from './RootProviders/index.js'

/** Renders the Flight layout with the app's client-local server-function dispatcher. */
export function PayloadLayout({ serverFunction }: { serverFunction: ServerFunctionClient }) {
  const { layout }: LoadLayoutDataResult = useLoaderData({ strict: false })
  const deferredLayout = useDeferredValue(layout)

  return <ServerFunctionContext value={serverFunction}>{deferredLayout}</ServerFunctionContext>
}
