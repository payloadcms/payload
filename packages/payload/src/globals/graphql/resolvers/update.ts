/* eslint-disable no-param-reassign */
import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import update from '../../operations/update'

type Resolver<TSlug extends keyof GeneratedTypes['globals']> = (
  _: unknown,
  args: {
    data?: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
    draft?: boolean
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<GeneratedTypes['globals'][TSlug]>

export default function updateResolver<TSlug extends keyof GeneratedTypes['globals']>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty<PayloadRequest>(req, 'locale')
    req = isolateObjectProperty<PayloadRequest>(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    if (!req.query) req.query = {}

    const draft: boolean =
      args.draft ?? req.query?.draft === 'false'
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') req.query.draft = String(draft)

    context.req = req

    const options = {
      slug: globalConfig.slug,
      data: args.data,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await update<TSlug>(options)
    return result
  }
}
