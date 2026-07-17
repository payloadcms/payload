'use client'
import React, { createContext, use, useEffect, useState } from 'react'

import { useConfig } from '../Config/index.js'
import { useSearchParams } from '../RouterAdapter/index.js'

export type EmbedContext = {
  isEmbedded: boolean
}

const initialContext: EmbedContext = {
  isEmbedded: false,
}

const Context = createContext<EmbedContext | undefined>(undefined)

const hasEmbedCookie = (cookieKey: string): boolean =>
  document.cookie
    .split('; ')
    .some((row) => row.startsWith(`${cookieKey}=`) && row.split('=')[1] === 'true')

/**
 * Writes a session-scoped, `Partitioned` (CHIPS) cookie so embed mode persists
 * across navigation within the iframe.
 *
 * The cookie is keyed to both the iframe domain and the embedding top-level domain,
 * so it is readable only on that one top-level domain.
 *
 * No `Expires`/`Max-Age` — it is a session cookie that clears when the browsing session ends.
 */
const setEmbedCookie = (cookieKey: string): void => {
  document.cookie = `${cookieKey}=true; path=/; SameSite=None; Secure; Partitioned`
}

const deleteEmbedCookie = (cookieKey: string): void => {
  document.cookie = `${cookieKey}=; path=/; SameSite=None; Secure; Partitioned; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

const resolveEmbedParam = (embedParam: null | string, fallback: boolean): boolean => {
  switch (embedParam) {
    case 'false':
      return false
    case 'true':
      return true
    default:
      return fallback
  }
}

export const EmbedProvider: React.FC<{
  children?: React.ReactNode
  /**
   * Initial embed value is read from the embed cookie in the root layout. The root layout
   * cannot see search params, so the client reads the `?embed` query parameter below
   * and it takes precedence over the cookie value.
   */
  embed?: boolean
}> = ({ children, embed }) => {
  const { config } = useConfig()
  const embedCookieKey = `${config.cookiePrefix || 'payload'}-embed`
  const embedParam = useSearchParams().get('embed')?.toLowerCase()

  const [isEmbedded, setIsEmbedded] = useState<boolean>(() =>
    resolveEmbedParam(embedParam, Boolean(embed)),
  )

  useEffect(() => {
    // The query parameter takes precedence; otherwise fall back to the cookie value
    if (embedParam === 'true') {
      setEmbedCookie(embedCookieKey)
    } else if (embedParam === 'false') {
      deleteEmbedCookie(embedCookieKey)
    }
    setIsEmbedded(hasEmbedCookie(embedCookieKey))
  }, [embedParam, embedCookieKey])

  return <Context value={{ isEmbedded }}>{children}</Context>
}

export const useEmbed = (): EmbedContext => use(Context) ?? initialContext
