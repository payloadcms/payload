import type { I18n, I18nClient } from '@payloadcms/translations'

import { initI18n } from '@payloadcms/translations'
import * as qs from 'qs-esm'

import type { ImportMap } from '../bin/generateImportMap/index.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { ServerAdapter } from './adapters/server.js'
import type { InitReqResult } from './functions/index.js'

import { executeAuthStrategies } from '../auth/executeAuthStrategies.js'
import { getAccessResults } from '../auth/getAccessResults.js'
import { getPayload } from '../index.js'
import { createLocalReq } from '../utilities/createLocalReq.js'
import { getRequestLanguage } from '../utilities/getRequestLanguage.js'
import { parseCookies } from '../utilities/parseCookies.js'
import { getRequestLocale } from './getRequestLocale.js'

export type InitReqPartialResult = {
  i18n: I18nClient
} & Pick<InitReqResult, 'languageCode'> &
  Pick<PayloadRequest, 'payload' | 'responseHeaders' | 'user'>

export type InitReqCache = {
  getPartial: (factory: () => Promise<InitReqPartialResult>) => Promise<InitReqPartialResult>
  getRequest: (factory: () => Promise<InitReqResult>, key: string) => Promise<InitReqResult>
}

export type InitReqArgs = {
  cache?: InitReqCache
  canSetHeaders?: boolean
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key?: string
  overrides?: Parameters<typeof createLocalReq>[0]
  requestURL?: string
  serverAdapter: ServerAdapter
}

export async function initReq({
  cache,
  canSetHeaders,
  configPromise,
  importMap,
  key,
  overrides,
  requestURL,
  serverAdapter,
}: InitReqArgs): Promise<InitReqResult> {
  if (cache && !key) {
    throw new Error('initReq requires a key when cache is provided')
  }

  const headers = await serverAdapter.getHeaders()
  const cookies = parseCookies(headers)
  const partialFactory = async (): Promise<InitReqPartialResult> => {
    const config = await configPromise
    const payload = await getPayload({ config, cron: true, importMap })
    const languageCode = getRequestLanguage({
      config,
      cookies,
      headers,
    })
    const i18n = await initI18n({
      config: config.i18n,
      context: 'client',
      language: languageCode,
    })
    const { responseHeaders, user } = await executeAuthStrategies({
      canSetHeaders,
      headers,
      payload,
    })

    return {
      i18n,
      languageCode,
      payload,
      responseHeaders,
      user,
    }
  }
  const partialResult = cache ? await cache.getPartial(partialFactory) : await partialFactory()
  const requestFactory = async (): Promise<InitReqResult> => {
    const { i18n, languageCode, payload, responseHeaders, user } = partialResult
    const { req: reqOverrides, ...optionsOverrides } = overrides || {}
    const requestDefaults = getRequestDefaults({ requestURL })
    const req = await createLocalReq(
      {
        req: {
          headers,
          host: headers.get('host') ?? undefined,
          i18n: i18n as I18n,
          responseHeaders,
          server: serverAdapter,
          user,
          ...requestDefaults,
          ...(reqOverrides || {}),
        },
        ...(optionsOverrides || {}),
      },
      payload,
    )
    const locale = await getRequestLocale({ req })

    req.locale = locale?.code

    const permissions = await getAccessResults({ req })

    return {
      cookies,
      headers,
      languageCode,
      locale,
      permissions,
      req,
    }
  }
  const result = cache ? await cache.getRequest(requestFactory, key!) : await requestFactory()

  return {
    ...result,
    req: {
      ...result.req,
      ...(result.req.context
        ? {
            context: { ...result.req.context },
          }
        : {}),
    },
  }
}

function getRequestDefaults({
  requestURL,
}: {
  requestURL?: string
}): Partial<Pick<PayloadRequest, 'query' | 'url'>> {
  if (!requestURL) {
    return {}
  }

  try {
    const url = new URL(requestURL)

    return {
      ...(url.search
        ? {
            query: qs.parse(url.search, {
              depth: 10,
              ignoreQueryPrefix: true,
            }) as PayloadRequest['query'],
          }
        : {}),
      url: requestURL,
    }
  } catch {
    return {}
  }
}
