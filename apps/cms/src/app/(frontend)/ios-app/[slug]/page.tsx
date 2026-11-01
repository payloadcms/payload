import type {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
} from '@payloadcms/richtext-lexical'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'

import { LinkJSXConverter, RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { cache } from 'react'

import type { Code, Page, YouTubeBlock } from '@/payload-types'

import config from '@/payload.config'

import './index.css'

type Args = { params: Promise<{ slug: string }> }

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<Code | YouTubeBlock>

const APP_NAME = 'VgemsAI'
const SITE = 'ios-app'

// Published edits show up on the next visit
export const dynamic = 'force-dynamic'

/**
 * A published page of the iOS app as a web page, e.g. /ios-app/privacy-policy for its Privacy
 * Policy: the address App Store Connect and the app link to. Drafts and pages of other sites
 * aren't shown.
 */
export default async function IOSAppPage({ params }: Args) {
  const page = await findPage((await params).slug)

  if (!page) {
    notFound()
  }

  return (
    <article className="app-page">
      <p className="app-page__app">{APP_NAME}</p>
      <h1>{page.title}</h1>
      <RichText className="app-page__content" converters={converters} data={page.content} />
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const page = await findPage((await params).slug)

  return page
    ? {
        description: page.seo?.description || page.description,
        title: `${page.seo?.title || page.title} · ${APP_NAME}`,
      }
    : {}
}

/** Once per request, for the page and its metadata */
const findPage = cache(async (slug: string): Promise<null | Page> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    // Pages that links point to, for their address
    depth: 1,
    limit: 1,
    // As a visitor: only published pages
    overrideAccess: false,
    pagination: false,
    where: { and: [{ slug: { equals: slug } }, { sites: { in: [SITE] } }] },
  })

  return docs[0] ?? null
})

/** Links to other pages of the iOS app go to their page here */
function internalDocToHref({ linkNode }: { linkNode: SerializedLinkNode }) {
  const { relationTo, value } = linkNode.fields.doc ?? {}
  const linked = typeof value === 'object' ? (value as Partial<Page>) : undefined

  return relationTo === 'pages' && linked?.slug && linked.sites?.includes(SITE)
    ? `/${SITE}/${linked.slug}`
    : '#'
}

const converters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  // The blocks of the page editor (src/collections/Pages.ts)
  blocks: {
    Code: ({ node }) => (
      <pre>
        <code>{node.fields.code}</code>
      </pre>
    ),
    youtube: ({ node }) => <a href={node.fields.url}>{node.fields.title || node.fields.url}</a>,
  },
  ...LinkJSXConverter({ internalDocToHref }),
})
