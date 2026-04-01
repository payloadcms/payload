import type { I18n, I18nClient } from '@payloadcms/translations'
import type { ImportMap, InitReqResult, PayloadRequest, SanitizedConfig } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { getRequestLocale } from '@payloadcms/ui/utilities/getRequestLocale'
import { selectiveCache } from '@payloadcms/ui/utilities/selectiveCache'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'
import { getWebRequest } from 'vinxi/http'

type PartialResult = {
  i18n: I18nClient
} & Pick<InitReqResult, 'languageCode'> &
  Pick<PayloadRequest, 'payload' | 'responseHeaders' | 'user'>

const partialReqCache = selectiveCache<PartialResult>('partialReq')
const reqCache = selectiveCache<InitReqResult>('req')

export const initReq = async function ({
  config: configArg,
  importMap,
  key = 'adapter',
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key?: string
}): Promise<InitReqResult> {
  // getWebRequest() returns the current server request from Vinxi's context store
  const request = getWebRequest()
  const headers = new Headers(request.headers)
  const cookies = parseCookies(headers)

  const partialResult = await partialReqCache.get(async () => {
    const config = await configArg
    const payload = await getPayload({ config, cron: true, importMap })
    const languageCode = getRequestLanguage({ config, cookies, headers })

    const i18n: I18nClient = await initI18n({
      config: config.i18n,
      context: 'client',
      language: languageCode,
    })

    const { responseHeaders, user } = await executeAuthStrategies({
      headers,
      payload,
    })

    return { i18n, languageCode, payload, responseHeaders, user }
  }, 'global')

  return reqCache
    .get(async () => {
      const { i18n, languageCode, payload, responseHeaders, user } = partialResult

      const req = await createLocalReq(
        {
          req: {
            headers,
            host: headers.get('host'),
            i18n: i18n as I18n,
            responseHeaders,
            url: request.url,
            user,
          },
        },
        payload,
      )

      const locale = await getRequestLocale({ req })
      req.locale = locale?.code

      const permissions = await getAccessResults({ req })

      return { cookies, headers, languageCode, locale, permissions, req }
    }, key)
    .then((result) => ({
      ...result,
      req: {
        ...result.req,
        ...(result.req?.context ? { context: { ...result.req.context } } : {}),
      },
    }))
}
