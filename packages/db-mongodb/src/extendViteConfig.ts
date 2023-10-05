import type { SanitizedConfig } from 'payload/config'

export const vite = (config) => {
  return {
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      exclude: [...config.optimizeDeps.exclude, '@payloadcms/db-mongodb'],
    },
  }
}

export const extendViteConfig = (config: SanitizedConfig) => {
  const existingViteConfig = config.admin.vite ? config.admin.vite : (viteConfig) => viteConfig

  config.admin.vite = (webpackConfig) => {
    return vite(existingViteConfig(webpackConfig))
  }
}
