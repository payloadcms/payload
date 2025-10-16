/* eslint-disable no-restricted-exports */
'use server'

import type { WidgetServerProps } from 'payload'

import { Suspense } from 'react'

import CountFilteredClient from './CountFilteredClient'

export default async function CountFilteredClientWrapper(
  paramsPromise: Promise<WidgetServerProps>,
) {
  const params = await paramsPromise
  const widgetData = params.widgetData
  //   console.log('(CountFilteredClientWrapper) widgetData', widgetData)
  return <CountFilteredClient widgetData={widgetData} />
}
