import React from 'react'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next'
import QueryString from 'qs'
import { ParsedUrlQuery } from 'querystring'

import { Gutter } from '../components/Gutter'
import RichText from '../components/RichText'
import type { MainMenu, Page as PageType } from '../payload-types'

import classes from './[slug].module.scss'

const Page: React.FC<
  PageType & {
    mainMenu: MainMenu
  }
> = initialPage => {
  const { data } = useLivePreview({
    serverURL: process.env.NEXT_PUBLIC_PAYLOAD_URL || '',
    depth: 2,
    initialData: initialPage,
  })

  return (
    <main className={classes.page}>
      <Gutter>
        <RichText content={data?.richText} />
      </Gutter>
    </main>
  )
}

export default Page

interface IParams extends ParsedUrlQuery {
  slug: string
}

export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
  const { params } = context

  let { slug } = (params as IParams) || {}
  if (!slug) slug = 'home'

  let doc = {}
  const notFound = false

  const lowerCaseSlug = slug.toLowerCase() // NOTE: let the url be case insensitive

  const searchParams = QueryString.stringify(
    {
      where: {
        slug: {
          equals: lowerCaseSlug,
        },
      },
      depth: 2,
    },
    {
      encode: false,
      addQueryPrefix: true,
    },
  )

  const pageReq = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages${searchParams}`)

  if (pageReq.ok) {
    const pageData = await pageReq.json()
    doc = pageData.docs[0]
    if (!doc) {
      return {
        notFound: true,
      }
    }
  }

  return {
    props: {
      ...doc,
      collection: 'pages',
    },
    notFound,
    revalidate: 3600, // in seconds
  }
}

type Path = {
  params: {
    slug: string
  }
}

type Paths = Path[]

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: Paths = []

  const pagesReq = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?depth=0&limit=300`)

  const pagesData = await pagesReq.json()

  if (pagesReq?.ok) {
    const { docs: pages } = pagesData

    if (pages && Array.isArray(pages) && pages.length > 0) {
      paths = pages.map(page => ({ params: { slug: page.slug } }))
    }
  }

  return {
    paths,
    fallback: true,
  }
}
