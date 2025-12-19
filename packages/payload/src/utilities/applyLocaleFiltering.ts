import type { ClientConfig } from '../config/client.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

export async function applyLocaleFiltering({
  clientConfig,
  config,
  req,
}: {
  clientConfig: ClientConfig
  config: SanitizedConfig
  req: PayloadRequest
}): Promise<void> {
  if (
    !clientConfig.localization ||
    !config.localization ||
    typeof config.localization.filterAvailableLocales !== 'function'
  ) {
    return
  }

  const filteredLocales = (
    await config.localization.filterAvailableLocales({
      locales: config.localization.locales,
      req,
    })
  ).map(({ toString, ...rest }) => rest)

  clientConfig.localization.localeCodes = filteredLocales.map(({ code }) => code)
  clientConfig.localization.locales = filteredLocales
}
