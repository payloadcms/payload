/* eslint-disable no-param-reassign */
import type { SanitizedConfig } from 'payload/config'
// @ts-expect-error
import type { InlineConfig } from 'vite'

import rollupCommonJS from '@rollup/plugin-commonjs'
import image from '@rollup/plugin-image'
import react from '@vitejs/plugin-react'
import getPort from 'get-port'
import path from 'path'
import scss from 'rollup-plugin-scss'
import viteCommonJS from 'vite-plugin-commonjs'
import virtual from 'vite-plugin-virtual'

const bundlerPath = path.resolve(__dirname, '../')
const mockModulePath = path.resolve(__dirname, '../mocks/emptyModule.js')
const mockDotENVPath = path.resolve(__dirname, '../mocks/dotENV.js')

export const getViteConfig = async (payloadConfig: SanitizedConfig): Promise<InlineConfig> => {
  const { createLogger } = await import('vite')

  const logger = createLogger('warn', { allowClearScreen: false, prefix: '[VITE-WARNING]' })
  const originalWarning = logger.warn
  logger.warn = (msg, options) => {
    // TODO: fix this? removed these warnings to make debugging easier
    if (msg.includes('Default and named imports from CSS files are deprecated')) return
    originalWarning(msg, options)
  }

  const hmrPort = await getPort()

  const absoluteAliases = {
    [`${bundlerPath}`]: path.resolve(__dirname, '../mock.js'),
  }

  const alias = [
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
          alias[source] = target
        }
      })
    }
  }

  return {
    base: payloadConfig.routes.admin,
    build: {
      commonjsOptions: {
        include: [/payload/],
        transformMixedEsModules: true,
      },
      outDir: payloadConfig.admin.buildPath,
      rollupOptions: {
        // output: {
        //   manualChunks: {
        //     jsonWorker: ['monaco-editor/esm/vs/language/json/json.worker'],
        //     cssWorker: ['monaco-editor/esm/vs/language/css/css.worker'],
        //     htmlWorker: ['monaco-editor/esm/vs/language/html/html.worker'],
        //     tsWorker: ['monaco-editor/esm/vs/language/typescript/ts.worker'],
        //     editorWorker: ['monaco-editor/esm/vs/editor/editor.worker'],
        //   },
        // },
        input: {
          main: path.resolve(__dirname, '../index.html'),
        },
        plugins: [
          image(),
          rollupCommonJS(),
          scss({
            output: path.resolve(payloadConfig.admin.buildPath, 'styles.css'),
            outputStyle: 'compressed',
            // include: [`${relativeAdminPath}/**/*.scss`],
          }),
        ],
        treeshake: true,
      },
    },
    customLogger: logger,
    define: {
      __dirname: '""',
      'module.hot': 'undefined',
      'process.argv': '[]',
      'process.cwd': '() => ""',
      'process.env': '{}',
    },
    optimizeDeps: {
      exclude: [
        // Dependencies that need aliases should be excluded
        // from pre-bundling
      ],
      include: [
        'payload/**/*.tsx',
        'payload/**/*.ts',
        // 'slate',
        // 'slate-react',
        // 'slate-history',
        // 'is-hotkey',
        // 'slate-hyperscript',
        // '@monaco-editor/react',
      ],
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
          }

          if (fullSourcePath) {
            const aliasMatch = absoluteAliases[fullSourcePath]
            if (aliasMatch) {
              return aliasMatch
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
      // viteCommonJS(),
      // {
      //   name: 'init-admin-panel',
      //   transformIndexHtml(html) {
      //     const indexFile = process.env.PAYLOAD_DEV_MODE === 'true' ? 'index.tsx' : 'index.js'

      //     if (html.includes(`/${indexFile}`)) return html

      //     return html.replace(
      //       '</body>',
      //       `<script> var exports = {}; </script></script><script type="module" src="${payloadConfig.routes.admin}/${indexFile}"></script></body>`,
      //     )
      //   },
      // },
    ],
    resolve: {
      alias,
    },
    root: path.resolve(__dirname, '../'),
    server: {
      hmr: {
        port: hmrPort,
      },
      middlewareMode: true,
    },
  }
}
