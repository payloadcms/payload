import React from 'react'
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next'
import { ParsedUrlQuery } from 'querystring'

import { Gutter } from '../components/Gutter'
import RichText from '../components/RichText'
import type { MainMenu, Page, Page as PageType } from '../payload-types'

import classes from './[...slug].module.scss'

const Page: React.FC<
  PageType & {
    mainMenu: MainMenu
    preview?: boolean
  }
> = props => {
  const { title, richText } = props

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
  slug: string[]
}

export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
  const { params } = context

  let { slug } = (params as IParams) || {}
  if (!slug) slug = ['home']

  const lastSlug = slug[slug.length - 1]

  const page: Page = await fetch(
    `${
      process.env.NEXT_PUBLIC_PAYLOAD_URL
    }/api/pages?where[slug][equals]=${lastSlug.toLowerCase()}&depth=1`,
  )?.then(res => res.json()?.then(data => data.docs[0]))

  return {
    props: {
      ...page,
      collection: 'pages',
    },
    notFound: !page,
    revalidate: 3600, // in seconds
  }
}

type Path = {
  params: {
    slug: string[]
  }
}

type Paths = Path[]

export const getStaticPaths: GetStaticPaths = async () => {
  let paths: Paths = []

  const pages: Page[] = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?depth=0&limit=300`,
  )
    ?.then(res => res.json())
    ?.then(data => data.docs)

  if (pages && Array.isArray(pages) && pages.length > 0) {
    paths = pages.map(page => {
      const { slug, breadcrumbs } = page

      let slugs = [slug]

      const hasBreadcrumbs = breadcrumbs && Array.isArray(breadcrumbs) && breadcrumbs.length > 0

      if (hasBreadcrumbs) {
        slugs = breadcrumbs
          .map(crumb => {
            const { url } = crumb
            let slug: string = ''

            if (url) {
              const split = url.split('/')
              slug = split[split.length - 1]
            }

            return slug
          })
          ?.filter(Boolean)
      }

      return { params: { slug: slugs } }
    })
  }

  return {
    paths,
    fallback: true,
  }
}
