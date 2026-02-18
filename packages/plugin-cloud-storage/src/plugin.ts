import type { Config } from 'payload'

import type { AllowList, PluginOptions } from './types.js'

import { getFields } from './fields/getFields.js'
import { getAfterChangeHook } from './hooks/afterChange.js'
import { getAfterDeleteHook } from './hooks/afterDelete.js'
import { getPreserveFileDataHook } from './hooks/preserveFileData.js'

// This plugin extends all targeted collections by offloading uploaded files
// to cloud storage instead of solely storing files locally.

// It is based on an adapter approach, where adapters can be written for any cloud provider.
// Adapters are responsible for providing four actions that this plugin will use:
// 1. handleUpload, 2. handleDelete, 3. generateURL, 4. staticHandler

// Optionally, the adapter can specify any Webpack config overrides if they are necessary.

export const cloudStoragePlugin =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    const { alwaysInsertFields, collections: allCollectionOptions, enabled } = pluginOptions
    const config = { ...incomingConfig }

    // If disabled but alwaysInsertFields is true, only insert fields without full plugin functionality
    if (enabled === false) {
      if (alwaysInsertFields) {
        return {
          ...config,
          collections: (config.collections || []).map((existingCollection) => {
            const options = allCollectionOptions[existingCollection.slug]

            if (options) {
              // If adapter is provided, use it to get fields
              const adapter = options.adapter
                ? options.adapter({
                    collection: existingCollection,
                    prefix: options.prefix,
                  })
                : undefined

              const fields = getFields({
                adapter,
                alwaysInsertFields: true,
                collection: existingCollection,
                disablePayloadAccessControl: options.disablePayloadAccessControl,
                generateFileURL: options.generateFileURL,
                prefix: options.prefix,
              })

              return {
                ...existingCollection,
                fields,
              }
            }

            return existingCollection
          }),
        }
      }

      return config
    }

    const initFunctions: Array<() => void> = []

    return {
      ...config,
      collections: (config.collections || []).map((existingCollection) => {
        const options = allCollectionOptions[existingCollection.slug]

        if (options?.adapter) {
          const adapter = options.adapter({
            collection: existingCollection,
            prefix: options.prefix,
          })

          if (adapter.onInit) {
            initFunctions.push(adapter.onInit)
          }

          const fields = getFields({
            adapter,
            collection: existingCollection,
            disablePayloadAccessControl: options.disablePayloadAccessControl,
            generateFileURL: options.generateFileURL,
            prefix: options.prefix,
          })

          const handlers = [
            ...(typeof existingCollection.upload === 'object' &&
            Array.isArray(existingCollection.upload.handlers)
              ? existingCollection.upload.handlers
              : []),
          ]

          if (!options.disablePayloadAccessControl) {
            handlers.push(adapter.staticHandler)
            // Else if disablePayloadAccessControl: true and clientUploads is used
            // Build the "proxied" handler that responses only when the file was requested by client upload in addDataAndFileToRequest
          } else if (adapter.clientUploads) {
            handlers.push((req, args) => {
              if ('clientUploadContext' in args.params) {
                return adapter.staticHandler(req, args)
              }
            })
          }

          const getSkipSafeFetchSetting = (): AllowList | boolean => {
            if (options.disablePayloadAccessControl) {
              return true
            }
            const isBooleanTrueSkipSafeFetch =
              typeof existingCollection.upload === 'object' &&
              existingCollection.upload.skipSafeFetch === true

            const isAllowListSkipSafeFetch =
              typeof existingCollection.upload === 'object' &&
              Array.isArray(existingCollection.upload.skipSafeFetch)

            if (isBooleanTrueSkipSafeFetch) {
              return true
            } else if (isAllowListSkipSafeFetch) {
              const existingSkipSafeFetch =
                typeof existingCollection.upload === 'object' &&
                Array.isArray(existingCollection.upload.skipSafeFetch)
                  ? existingCollection.upload.skipSafeFetch
                  : []

              const hasExactLocalhostMatch = existingSkipSafeFetch.some((entry) => {
                const entryKeys = Object.keys(entry)
                return entryKeys.length === 1 && entry.hostname === 'localhost'
              })

              const localhostEntry =
                process.env.NODE_ENV !== 'production' && !hasExactLocalhostMatch
                  ? [{ hostname: 'localhost' }]
                  : []

              return [...existingSkipSafeFetch, ...localhostEntry]
            }

            if (process.env.NODE_ENV !== 'production') {
              return [{ hostname: 'localhost' }]
            }

            return false
          }

          return {
            ...existingCollection,
            fields,
            hooks: {
              ...(existingCollection.hooks || {}),
              afterChange: [
                ...(existingCollection.hooks?.afterChange || []),
                getAfterChangeHook({ adapter, collection: existingCollection }),
              ],
              afterDelete: [
                ...(existingCollection.hooks?.afterDelete || []),
                getAfterDeleteHook({ adapter, collection: existingCollection }),
              ],
              beforeChange: [
                ...(existingCollection.hooks?.beforeChange || []),
                getPreserveFileDataHook(),
              ],
            },
            upload: {
              ...(typeof existingCollection.upload === 'object' ? existingCollection.upload : {}),
              adapter: adapter.name,
              disableLocalStorage:
                typeof options.disableLocalStorage === 'boolean'
                  ? options.disableLocalStorage
                  : true,
              handlers,
              skipSafeFetch: getSkipSafeFetchSetting(),
            },
          }
        }

        return existingCollection
      }),
      onInit: async (payload) => {
        initFunctions.forEach((fn) => fn())
        if (config.onInit) {
          await config.onInit(payload)
        }
      },
    }
  }
