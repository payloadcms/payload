'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'

import { Page } from '../../../payload/payload-types'
import { POST_PREMIUM_CONTENT } from '../../_graphql/posts'
import { useAuth } from '../../_providers/Auth'
import { Blocks } from '../Blocks'
import { Gutter } from '../Gutter'
import { LoadingShimmer } from '../LoadingShimmer'
import { Message } from '../Message'
import { VerticalPadding } from '../VerticalPadding'

export const PremiumContent: React.FC<{
  postSlug: string
  disableTopPadding?: boolean
}> = props => {
  const { postSlug, disableTopPadding } = props
  const { user } = useAuth()

  const [isLoading, setIsLoading] = React.useState(false)
  const [blocks, setBlocks] = React.useState<Page['layout']>()
  const hasInitialized = React.useRef(false)
  const isRequesting = React.useRef(false)

  useEffect(() => {
    if (!user || hasInitialized.current || isRequesting.current) return
    hasInitialized.current = true
    isRequesting.current = true

    const start = Date.now()

    const getPaywallContent = async () => {
      setIsLoading(true)

      try {
        const premiumContent = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/graphql`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: POST_PREMIUM_CONTENT,
            variables: {
              slug: postSlug,
            },
          }),
        })
          ?.then(res => res.json())
          ?.then(res => res?.data?.Posts.docs[0]?.premiumContent)

        if (premiumContent) {
          setBlocks(premiumContent)
        }

        // wait before setting `isLoading` to `false` to give the illusion of loading
        // this is to prevent a flash of the loading shimmer on fast networks
        const end = Date.now()
        if (end - start < 1000) {
          await new Promise(resolve => setTimeout(resolve, 500 - (end - start)))
        }

        setIsLoading(false)
      } catch (error) {
        console.error(error) // eslint-disable-line no-console
        setIsLoading(false)
      }
    }

    getPaywallContent()

    isRequesting.current = false
  }, [user, postSlug])

  if (user === undefined) {
    return null
  }

  if (user === null) {
    return (
      <Gutter>
        <VerticalPadding bottom="large" top="none">
          <Message
            message={
              <>
                {`This content is gated behind authentication. You must be `}
                <Link href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                  logged in
                </Link>
                {` to view this content.`}
              </>
            }
          />
        </VerticalPadding>
      </Gutter>
    )
  }

  if (isLoading) {
    return (
      <Gutter>
        <VerticalPadding bottom="large" top="none">
          <LoadingShimmer />
        </VerticalPadding>
      </Gutter>
    )
  }

  if (!blocks || blocks.length === 0) {
    return (
      <Gutter>
        <VerticalPadding bottom="large" top="none">
          <Message message="Log in to unlock this premium content." />
        </VerticalPadding>
      </Gutter>
    )
  }

  return <Blocks blocks={blocks} disableTopPadding={disableTopPadding} />
}
