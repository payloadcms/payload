'use client'

import { usePreferences, useServerFunctions } from '@payloadcms/ui'
import { PREFERENCE_KEYS } from 'payload'
import { useCallback, useState } from 'react'

import type { RenderTabServerFnArgs, RenderTabServerFnReturnType } from './renderTabServerFn.js'

export type UseSidebarItemsArgs = {
  initialActiveID: string
  initialContents: Record<string, React.ReactNode>
}

export type UseSidebarItemsReturn = {
  activeContent: React.ReactNode
  activeID: string
  isLoading: boolean
  switchTo: (slug: string) => void
}

export const useSidebarItems = ({
  initialActiveID,
  initialContents,
}: UseSidebarItemsArgs): UseSidebarItemsReturn => {
  const { setPreference } = usePreferences()
  const { serverFunction } = useServerFunctions()

  const [activeID, setActiveID] = useState(initialActiveID)
  const [contents, setContents] = useState<Record<string, React.ReactNode>>(initialContents)
  const [loadingSlug, setLoadingSlug] = useState<null | string>(null)

  const loadContent = useCallback(
    async (slug: string) => {
      if (contents[slug]) {
        return
      }

      setLoadingSlug(slug)

      try {
        const result = (await serverFunction({
          name: 'render-tab',
          args: { tabSlug: slug } as RenderTabServerFnArgs,
        })) as RenderTabServerFnReturnType

        setContents((prev) => ({
          ...prev,
          [slug]: result.component,
        }))
      } catch (_) {
        setContents((prev) => ({
          ...prev,
          [slug]: null,
        }))
      } finally {
        setLoadingSlug(null)
      }
    },
    [serverFunction, contents],
  )

  const switchTo = useCallback(
    (slug: string) => {
      setActiveID(slug)
      void setPreference(PREFERENCE_KEYS.NAV_SIDEBAR_ACTIVE_TAB, {
        activeTab: slug,
      })
      void loadContent(slug)
    },
    [setPreference, loadContent],
  )

  const activeContent = contents[activeID]
  const isLoading = loadingSlug === activeID

  return {
    activeContent,
    activeID,
    isLoading,
    switchTo,
  }
}
