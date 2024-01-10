/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config'
// @ts-expect-error
import type { InlineConfig } from 'vite'

import image from '@rollup/plugin-image'
import react from '@vitejs/plugin-react'
import getPort from 'get-port'
import path from 'path'
import virtual from 'vite-plugin-virtual'

const mockModulePath = path.resolve(__dirname, './mocks/emptyModule.js')
const mockDotENVPath = path.resolve(__dirname, './mocks/dotENV.js')

export const getViteConfig = async (payloadConfig: SanitizedConfig): Promise<InlineConfig> => {
  const { createLogger, searchForWorkspaceRoot } = await import('vite')

  const logger = createLogger('warn', { allowClearScreen: false, prefix: '[VITE-WARNING]' })
  const originalWarning = logger.warn
  logger.warn = (msg, options) => {
    // TODO: fix this? removed these warnings to make debugging easier
    if (msg.includes('Default and named imports from CSS files are deprecated')) return
    originalWarning(msg, options)
  }

  const hmrPort = await getPort()

  const absoluteAliases = {}

  const alias = [
    { find: '@payloadcms/bundler-vite', replacement: path.resolve(__dirname, '../mock.js') },
    { find: '@payloadcms/db-mongodb', replacement: path.resolve(__dirname, '../mock.js') },
    { find: '@payloadcms/db-postgres', replacement: path.resolve(__dirname, '../mock.js') },
    { find: 'path', replacement: require.resolve('path-browserify') },
    { find: 'payload-config', replacement: payloadConfig.paths.rawConfig },
    { find: /payload$/, replacement: mockModulePath },
    { find: '~payload-user-css', replacement: payloadConfig.admin.css },
    { find: '~react-toastify', replacement: 'react-toastify' },
    { find: 'dotenv', replacement: mockDotENVPath },
  ]

  if (payloadConfig.admin.webpack && typeof payloadConfig.admin.webpack === 'function') {
    const webpackConfig = payloadConfig.admin.webpack({
      resolve: {
        alias: {},
      },
    })

    if (Object.keys(webpackConfig.resolve.alias).length > 0) {
      Object.entries(webpackConfig.resolve.alias).forEach(([source, target]) => {
        if (path.isAbsolute(source)) {
          absoluteAliases[source] = target
        } else {
          alias.push({
            find: source,
            replacement: target,
          })
        }
      })
    }
  }

  const define = {
    __dirname: '"/"',
    'module.hot': 'undefined',
    'process.argv': '[]',
    'process.cwd': 'function () { return "/" }',
    'process?.cwd': 'function () { return "/" }',
  }

  Object.entries(process.env).forEach(([key, val]) => {
    if (key.indexOf('PAYLOAD_PUBLIC_') === 0) {
      define[`process.env.${key}`] = `'${val}'`
    } else {
      define[`process.env.${key}`] = `''`
    }
  })

  let viteConfig: InlineConfig = {
    base: payloadConfig.routes.admin,
    build: {
      chunkSizeWarningLimit: 4000,
      emptyOutDir: true,
      outDir: payloadConfig.admin.buildPath,
      rollupOptions: {
        plugins: [image()],
        treeshake: true,
      },
    },
    customLogger: logger,
    define,
    optimizeDeps: {
      exclude: [
        // Dependencies that need aliases should be excluded
        // from pre-bundling
        '@payloadcms/bundler-vite',
        '@payloadcms/db-mongodb',
        '@payloadcms/db-postgres',
        ...(Object.keys(absoluteAliases) || []),
      ],
      include: ['payload/components/root', 'react-dom/client'],
    },
    plugins: [
      {
        name: 'absolute-aliases',
        enforce: 'pre',
        resolveId(source, importer) {
          let fullSourcePath: string

          // TODO: need to handle this better. This is overly simple.
          if (source.startsWith('.')) {
            fullSourcePath = path.resolve(path.dirname(importer), source)

            if (fullSourcePath) {
              const exactMatch = absoluteAliases[fullSourcePath]
              if (exactMatch) return exactMatch

              const indexMatch = absoluteAliases[`${fullSourcePath}/index`]
              if (indexMatch) return indexMatch

              const withoutFileExtensionMatch =
                absoluteAliases[`${fullSourcePath.replace(/\.[^/.]+$/, '')}`]
              if (withoutFileExtensionMatch) return withoutFileExtensionMatch
            }
          }

          return null
        },
      },
      virtual({
        crypto: 'export default {}',
        http: 'export default {}',
        https: 'export default {}',
      }),
      react(),
    ],
    resolve: {
      alias,
    },
    root: path.resolve(__dirname, './'),
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(__dirname, '../../../payload')],
      },
      hmr: {
        port: hmrPort,
      },
      middlewareMode: true,
    },
  }

  if (payloadConfig.admin.vite && typeof payloadConfig.admin.vite === 'function') {
    viteConfig = payloadConfig.admin.vite(viteConfig)
  }

  return viteConfig
}
