import merge from 'deepmerge'
import { isPlainObject } from 'is-plain-object'
import path from 'path'

import type {
  Config,
  LocalizationConfigWithLabels,
  LocalizationConfigWithNoLabels,
  SanitizedConfig,
} from './types'

import { defaultUserCollection } from '../auth/defaultUser'
import sanitizeCollection from '../collections/config/sanitize'
import { migrationsCollection } from '../database/migrations/migrationsCollection'
import { InvalidConfiguration } from '../errors'
import sanitizeGlobals from '../globals/config/sanitize'
import getPreferencesCollection from '../preferences/preferencesCollection'
import checkDuplicateCollections from '../utilities/checkDuplicateCollections'
import { defaults } from './defaults'

const sanitizeAdminConfig = (configToSanitize: Config): Partial<SanitizedConfig> => {
  const sanitizedConfig = { ...configToSanitize }

  // add default user collection if none provided
  if (!sanitizedConfig?.admin?.user) {
    const firstCollectionWithAuth = sanitizedConfig.collections.find(({ auth }) => Boolean(auth))
    if (firstCollectionWithAuth) {
      sanitizedConfig.admin.user = firstCollectionWithAuth.slug
    } else {
      sanitizedConfig.admin.user = defaultUserCollection.slug
      sanitizedConfig.collections.push(defaultUserCollection)
    }
  }

  if (!sanitizedConfig.collections.find(({ slug }) => slug === sanitizedConfig.admin.user)) {
    throw new InvalidConfiguration(
      `${sanitizedConfig.admin.user} is not a valid admin user collection`,
    )
  }

  return sanitizedConfig as Partial<SanitizedConfig>
}

export const sanitizeConfig = (incomingConfig: Config): SanitizedConfig => {
  const configWithDefaults: Config = merge(defaults, incomingConfig, {
    isMergeableObject: isPlainObject,
  }) as Config

  if (!configWithDefaults.serverURL) {
    configWithDefaults.serverURL = ''
  }

  const config: Partial<SanitizedConfig> = sanitizeAdminConfig(configWithDefaults)

  if (config.localization && config.localization.locales?.length > 0) {
    // clone localization config so to not break everything
    const firstLocale = config.localization.locales[0]
    if (typeof firstLocale === 'string') {
      config.localization.localeCodes = [
        ...(config.localization as unknown as LocalizationConfigWithNoLabels).locales,
      ]

      // is string[], so convert to Locale[]
      config.localization.locales = (
        config.localization as unknown as LocalizationConfigWithNoLabels
      ).locales.map((locale) => ({
        code: locale,
        label: locale,
        rtl: false,
        toString: () => locale,
      }))
    } else {
      // is Locale[], so convert to string[] for localeCodes
      config.localization.localeCodes = config.localization.locales.reduce((locales, locale) => {
        locales.push(locale.code)
        return locales
      }, [] as string[])

      config.localization.locales = (
        config.localization as LocalizationConfigWithLabels
      ).locales.map((locale) => ({
        ...locale,
        toString: () => locale.code,
      }))
    }
  }

  configWithDefaults.collections.push(getPreferencesCollection(configWithDefaults))
  configWithDefaults.collections.push(migrationsCollection)

  config.collections = config.collections.map((collection) =>
    sanitizeCollection(configWithDefaults, collection),
  )
  checkDuplicateCollections(config.collections)

  if (config.globals.length > 0) {
    config.globals = sanitizeGlobals(config as SanitizedConfig)
  }

  if (config.serverURL !== '') {
    config.csrf.push(config.serverURL)
  }

  if (typeof config?.admin?.webpack === 'function') {
    config.admin.webpack = (webpackConfig) => {
      const existingWebpackConfig =
        typeof config?.admin?.webpack === 'function'
          ? config.admin.webpack(webpackConfig)
          : webpackConfig
      const mongodbAlias = path.resolve(__dirname, '../bundlers/mocks/db-mongodb.js')
      const postgresAlias = path.resolve(__dirname, '../bundlers/mocks/db-postgres.js')

      return {
        ...existingWebpackConfig,
        resolve: {
          ...existingWebpackConfig.resolve,
          alias: {
            ...existingWebpackConfig.resolve?.alias,
            '@payloadcms/db-mongodb': mongodbAlias,
            '@payloadcms/db-postgres': postgresAlias,
          },
        },
      }
    }
  }

  if (typeof config?.admin?.vite === 'function') {
    config.admin.vite = (viteConfig) => {
      const existingViteConfig =
        typeof config?.admin?.vite === 'function' ? config.admin.vite(viteConfig) : viteConfig

      return {
        ...existingViteConfig,
        optimizeDeps: {
          ...viteConfig.optimizeDeps,
          exclude: [
            ...viteConfig.optimizeDeps.exclude,
            '@payloadcms/db-mongodb',
            '@payloadcms/db-postgres',
          ],
        },
      }
    }
  }

  return config as SanitizedConfig
}
