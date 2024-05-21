import type { Metadata } from 'next'

import { formatDateTime } from '@/utilities/formatDateTime'
import configPromise from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'
import RichText from 'src/app/components/RichText'

import type { Post } from '../../../../../payload-types'

import { PayloadRedirects } from '../../../../components/PayloadRedirects'
import { PostHero } from '../../../../heros/PostHero'
import { generateMeta } from '../../../../utilities/generateMeta'

export async function generateStaticParams() {
  const payload = await getPayloadHMR({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
  })

  return posts.docs?.map(({ slug }) => slug)
}

export default async function Post({ params: { slug = '' } }) {
  const url = '/posts/' + slug
  const post = await queryPostBySlug({ slug })

  if (!post) {
    notFound()
  }

  const { categories, populatedAuthors, publishedAt, title } = post

  return (
    <article className="pt-16 pb-16">
      <PayloadRedirects url={url} />
      <PostHero post={post} />

      <div className="flex flex-col gap-4 -mt-[8rem]">
        <div className="container max-w-[48rem] mx-auto mb-8">
          <div className="uppercase text-sm mb-6">
            {categories?.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                const { title: categoryTitle } = category

                const titleToUse = categoryTitle || 'Untitled category'

                const isLast = index === categories.length - 1

                return (
                  <React.Fragment key={index}>
                    {titleToUse}
                    {!isLast && <React.Fragment>, &nbsp;</React.Fragment>}
                  </React.Fragment>
                )
              }
              return null
            })}
          </div>

          <h1 className="text-6xl mb-12">{title}</h1>

          <div className="flex flex-col md:flex-row gap-4 md:gap-16">
            <div className="flex flex-col gap-4">
              {populatedAuthors && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Author</p>
                  {populatedAuthors.map((author, index) => {
                    const { name } = author

                    const isLast = index === populatedAuthors.length - 1
                    const secondToLast = index === populatedAuthors.length - 2

                    return (
                      <React.Fragment key={index}>
                        {name}
                        {secondToLast && populatedAuthors.length > 2 && (
                          <React.Fragment>, </React.Fragment>
                        )}
                        {secondToLast && populatedAuthors.length === 2 && (
                          <React.Fragment> </React.Fragment>
                        )}
                        {!isLast && populatedAuthors.length > 1 && (
                          <React.Fragment>and </React.Fragment>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              )}
            </div>
            {publishedAt && (
              <div className="flex flex-col gap-1">
                <p className="text-sm">Date Published</p>

                <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
              </div>
            )}
          </div>
        </div>
        <RichText content={post.content} />
      </div>
    </article>
  )
}

export async function generateMetadata({ params: { slug } }): Promise<Metadata> {
  const post = await queryPostBySlug({ slug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = draftMode()

  const payload = await getPayloadHMR({ config: configPromise })
  const user = draft ? await payload.auth({ headers: headers() }) : undefined

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
}
