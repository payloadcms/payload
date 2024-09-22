/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import type { Metadata } from 'next'
import type { PayloadServerAction } from 'payload'

import config from '@payload-config'
import { handleServerActions } from '@payloadcms/next/utilities'
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { generatePageMetadata, RootPage } from '@payloadcms/next/views'

import { importMap } from '../importMap.js'

type Args = {
  params: {
    segments: string[]
  }
  searchParams: {
    [key: string]: string | string[]
  }
}

const payloadServerAction: PayloadServerAction = async function (action, args) {
  'use server'
  return handleServerActions(action, {
    config,
    importMap,
    ...(args || {}),
  })
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, importMap, params, payloadServerAction, searchParams })

export default Page
