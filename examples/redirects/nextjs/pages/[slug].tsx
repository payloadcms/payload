import React from 'react'
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next'
import { ParsedUrlQuery } from 'querystring'

import { Gutter } from '../components/Gutter'
import RichText from '../components/RichText'
import type { MainMenu, Page } from '../payload-types'

import classes from './index.module.scss'

const Page: React.FC<
  Page & {
    mainMenu: MainMenu
    preview?: boolean
  }
> = props => {
  const { title, richText } = props

  return (
    <main>
      <Gutter>
        <h1 className={classes.hero}>{title}</h1>
        <RichText content={richText} />
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

  let pageData
  let doc

  const pageReq = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?where[slug][equals]=${slug}&depth=2&draft=true`,
  )

  if (pageReq.ok) {
    pageData = await pageReq.json()
    doc = pageData?.docs?.[0] || null
  }

  return {
    props: {
      ...doc,
      collection: 'pages',
    },
    notFound: !doc,
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
  let pagesReq
  let pagesData

  pagesReq = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/pages?where[_status][equals]=published&depth=0&limit=300`,
  )
  pagesData = await pagesReq.json()

  if (pagesReq?.ok) {
    const { docs: pages } = pagesData

    if (pages && Array.isArray(pages) && pages.length > 0) {
      paths = pages.map(({ slug }) => ({ params: { slug } }))
    }
  }

  return {
    paths,
    fallback: true,
  }
}
