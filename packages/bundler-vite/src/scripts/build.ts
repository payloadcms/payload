import type { SanitizedConfig } from 'payload/config'
// @ts-expect-error
import type { InlineConfig } from 'vite'

import { getViteConfig } from '../config'

type BuildAdminType = (options: {
  payloadConfig: SanitizedConfig
  viteConfig: InlineConfig
}) => Promise<void>
export const buildAdmin: BuildAdminType = async ({ payloadConfig, viteConfig: viteConfigArg }) => {
  const vite = await import('vite')
  const viteConfig = await getViteConfig(payloadConfig)

  try {
    await vite.build(viteConfig)
  } catch (e) {
    console.error(e)
    throw new Error('Error: there was an error building the vite prod config.')
  }
}
