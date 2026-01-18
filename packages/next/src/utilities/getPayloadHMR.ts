import type { InitOptions, Payload } from '@ruya.sa/payload'

import { getPayload } from '@ruya.sa/payload'

/**
 *  getPayloadHMR is no longer preferred.
 *  You can now use in all contexts:
 *  ```ts
 *   import { getPayload } from '@ruya.sa/payload'
 *  ```
 * @deprecated
 */
export const getPayloadHMR = async (
  options: Pick<InitOptions, 'config' | 'importMap'>,
): Promise<Payload> => {
  const result = await getPayload(options)

  result.logger.warn(
    "Deprecation warning: getPayloadHMR is no longer preferred. You can now use `import { getPayload } from '@ruya.sa/payload' in all contexts.",
  )

  return result
}
