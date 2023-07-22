import React, { useEffect } from 'react'

import { ARCHIVE_BLOCK, CALL_TO_ACTION, CONTENT, MEDIA_BLOCK } from '../../graphql/blocks'
import { Page } from '../../payload-types'
import { useAuth } from '../../providers/Auth'
import { Blocks } from '../Blocks'

export const PaywallBlocks: React.FC<{
  productSlug: string
  disableTopPadding?: boolean
}> = props => {
  const { productSlug, disableTopPadding } = props
  const { user } = useAuth()

  const [isLoading, setIsLoading] = React.useState(false)
  const [blocks, setBlocks] = React.useState<Page['layout']>()
  const hasInitialized = React.useRef(false)

  useEffect(() => {
    if (!user || hasInitialized.current) return
    hasInitialized.current = true

    const getPaywallContent = async () => {
      setIsLoading(true)

      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/graphql`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query {
            Products(where: { slug: { equals: "${productSlug}" }}) {
              docs {
                paywall {
                  ${CALL_TO_ACTION}
                  ${CONTENT}
                  ${MEDIA_BLOCK}
                  ${ARCHIVE_BLOCK}
                }
              }
            },
          }`,
        }),
      })

      const { data } = await res.json()
      const paywall = data.Products?.docs?.[0]?.paywall

      if (paywall) {
        setBlocks(paywall)
      }

      setIsLoading(false)
    }

    getPaywallContent()
  }, [user, productSlug])

  if (isLoading || !blocks || blocks.length === 0) return null

  return <Blocks blocks={blocks} disableTopPadding={disableTopPadding} />
}
