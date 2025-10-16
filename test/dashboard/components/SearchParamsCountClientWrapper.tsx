/* eslint-disable no-restricted-exports */
'use server'

import type { WidgetServerProps } from 'payload'

import { Suspense } from 'react'

import SearchParamsCountClient from './SearchParamsCountClient'

export default async function SearchParamsCountClientWrapper(
  paramsPromise: Promise<WidgetServerProps>,
) {
  const params = await paramsPromise
  const widgetData = params.widgetData
  console.log('(SearchParamsCountClientWrapper) widgetData', widgetData)
  return <SearchParamsCountClient widgetData={widgetData} />
}
