import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { updateOperation } from '../../operations/update'

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
  },
) => Promise<GeneratedTypes['globals'][TSlug]>

export default function updateResolver<TSlug extends keyof GeneratedTypes['globals']>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const { slug } = globalConfig

    const options = {
      slug,
      data: args.data,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const result = await updateOperation<TSlug>(options)
    return result
  }
}
