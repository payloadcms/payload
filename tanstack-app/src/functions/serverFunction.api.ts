import type { I18n, I18nClient } from '@payloadcms/translations'
import type { DefaultServerFunctionArgs, ServerFunctionClientArgs } from 'payload'

import { initI18n } from '@payloadcms/translations'
import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'
import { findLocaleFromCode } from '@payloadcms/ui/shared'
import { dataOnlyServerFunctions } from '@payloadcms/ui/utilities/dataOnlyServerFunctions'
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'

import { getToSerializable } from './getToSerializable.js'

const serverFunctions = {
  ...sharedServerFunctions,
  ...dataOnlyServerFunctions,
}

export async function handleServerFunctionRequest(
  body: ServerFunctionClientArgs,
  headers: Headers,
) {
  const toSerializable = await getToSerializable()
  const configPromise = (await import('@payload-config')).default
  const { importMap } = await import('../importMap.js')

  const cookies = parseCookies(headers)
  // @ts-expect-error - monorepo dual SanitizedConfig types (dist vs src)
  const payload = await getPayload({ config: configPromise, importMap })
  const config = payload.config

  const languageCode = getRequestLanguage({ config, cookies, headers })

  const i18n: I18nClient = await initI18n({
    config: config.i18n,
    context: 'client',
    language: languageCode,
  })

  const { responseHeaders, user } = await executeAuthStrategies({ headers, payload })

  const req = await createLocalReq(
    {
      req: {
        headers,
        host: headers.get('host') ?? undefined,
        i18n: i18n as I18n,
        responseHeaders,
        user,
      },
    },
    payload,
  )

  if (config.localization) {
    const localeFromQuery = (req.query?.locale as string) || undefined
    const locale =
      findLocaleFromCode(config.localization, localeFromQuery) ??
      findLocaleFromCode(config.localization, config.localization.defaultLocale || 'en')

    req.locale = locale?.code
  }

  const permissions = await getAccessResults({ req })

  const { name: fnKey, args: fnArgs } = body

  const augmentedArgs: DefaultServerFunctionArgs = {
    ...fnArgs,
    cookies,
    importMap,
    locale: config.localization
      ? (findLocaleFromCode(config.localization, req.locale) ?? undefined)
      : undefined,
    mode: 'data-only',
    permissions,
    renderComponent: RenderClientComponent,
    req,
  }

  const fn = serverFunctions[fnKey]

  if (!fn) {
    throw new Error(`Unknown Server Function: ${fnKey}`)
  }

  const result = await fn(augmentedArgs)
  return toSerializable(result)
}
