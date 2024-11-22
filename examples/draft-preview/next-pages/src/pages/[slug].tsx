import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next'
import type { ParsedUrlQuery } from 'querystring'

import QueryString from 'qs'
import React from 'react'

import type { MainMenu, Page as PageType } from '../payload-types'

import { Gutter } from '../components/Gutter'
import RichText from '../components/RichText'
import classes from './[slug].module.scss'

const Page: React.FC<
  {
    mainMenu: MainMenu
    preview?: boolean
  } & PageType
> = (props) => {
  const { richText, title } = props

  return (
    <main className={classes.page}>
      <Gutter>
        <h1>{title}</h1>
        <RichText content={richText} />
      </Gutter>
    </main>
  )
}

export default Page

interface IParams extends ParsedUrlQuery {
  slug: string
}

// when 'preview' cookies are set in the browser, getStaticProps runs on every request :)
export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
  const { params, preview, previewData } = context

  const { payloadToken } =
    (previewData as {
      payloadToken: string
    }) || {}

  let { slug } = (params as IParams) || {}
  if (!slug) {slug = 'home'}

  let doc = {}
  const notFound = false

  const lowerCaseSlug = slug.toLowerCase() // NOTE: let the url be case insensitive

  const searchParams = QueryString.stringify(
    {
      depth: 1,
      draft: preview ? true : undefined,
      where: {
        slug: {
          equals: lowerCaseSlug,
        },
      },
    },
    {
      addQueryPrefix: true,
      encode: false,
    },
  )

  // when previewing, send the payload token to bypass draft access control
  const pageReq = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages${searchParams}`, {
    headers: {
      ...(preview
        ? {
            Authorization: `JWT ${payloadToken}`,
          }
        : {}),
    },
  })

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
    notFound,
    props: {
      ...doc,
      collection: 'pages',
      preview: preview || null,
    },
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

  const pagesReq = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?where[_status][equals]=published&depth=0&limit=300`,
  )

  const pagesData = await pagesReq.json()

  if (pagesReq?.ok) {
    const { docs: pages } = pagesData

    if (pages && Array.isArray(pages) && pages.length > 0) {
      paths = pages.map((page) => ({ params: { slug: page.slug } }))
    }
  }

  return {
    fallback: true,
    paths,
  }
}
