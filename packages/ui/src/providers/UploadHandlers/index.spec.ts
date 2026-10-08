// @vitest-environment jsdom

import type { UploadCollectionSlug } from 'payload'

import React, { act, useEffect, useEffectEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'

import type { UploadHandlersContext } from './index.js'

import { UploadHandlersProvider, useUploadHandlers } from './index.js'

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

describe('UploadHandlersProvider', () => {
  it('registers many upload handlers without rerendering context consumers', async () => {
    const collectionSlugs = Array.from(
      { length: 50 },
      (_, index) => `upload-${index}` as UploadCollectionSlug,
    )
    const container = document.createElement('div')
    const handler = vi.fn(async () => undefined)
    const root = createRoot(container)
    let context: undefined | UploadHandlersContext
    let contextConsumerRenderCount = 0

    document.body.appendChild(container)

    const RegisterUploadHandler = ({
      collectionSlug,
    }: {
      collectionSlug: UploadCollectionSlug
    }) => {
      const { setUploadHandler } = useUploadHandlers()
      const registerUploadHandler = useEffectEvent(() => {
        setUploadHandler({ collectionSlug, handler })
      })

      useEffect(() => {
        registerUploadHandler()
      }, [])

      return null
    }

    const ContextConsumer = () => {
      context = useUploadHandlers()
      contextConsumerRenderCount++

      return null
    }

    try {
      await act(async () => {
        root.render(
          React.createElement(
            UploadHandlersProvider,
            null,
            ...collectionSlugs.map((collectionSlug) =>
              React.createElement(RegisterUploadHandler, {
                collectionSlug,
                key: collectionSlug,
              }),
            ),
            React.createElement(ContextConsumer),
          ),
        )
      })

      expect(contextConsumerRenderCount).toBe(1)
      expect(context).toBeDefined()

      for (const collectionSlug of collectionSlugs) {
        expect(context?.getUploadHandler({ collectionSlug })).toBe(handler)
      }
    } finally {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    }
  })
})
