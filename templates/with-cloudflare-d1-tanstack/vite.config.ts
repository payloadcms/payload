import { cloudflare } from '@cloudflare/vite-plugin'
import { withPayload } from '@payloadcms/tanstack-start'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const payloadServerEntry = realpathSync(
  path.resolve(__dirname, 'node_modules/payload/dist/index.js'),
)

const payloadConfig = withPayload(
  ({ env, pluginOptions }) => {
    const useCloudflareRuntime =
      env.command === 'build' || process.env.CLOUDFLARE_RUNTIME === 'true'

    return {
      plugins: [
        useCloudflareRuntime && {
          name: 'payload-cloudflare-server-entry',
          enforce: 'pre',
          resolveId(source) {
            if (source === 'payload' && ['rsc', 'ssr'].includes(this.environment.name)) {
              return payloadServerEntry
            }
          },
          transform(code) {
            if (!['rsc', 'ssr'].includes(this.environment.name)) {
              return
            }

            let transformed = code

            transformed = transformed.replaceAll(
              'createRequire(import.meta.url)',
              "createRequire(typeof import.meta.url === 'string' ? import.meta.url : 'file:///worker/index.js')",
            )
            transformed = transformed.replaceAll(
              'fileURLToPath(import.meta.url)',
              "fileURLToPath(typeof import.meta.url === 'string' ? import.meta.url : 'file:///worker/index.js')",
            )

            if (transformed !== code) {
              return transformed
            }
          },
        },
        useCloudflareRuntime &&
          cloudflare({
            viteEnvironment: {
              childEnvironments: ['rsc'],
              name: 'ssr',
            },
          }),
        rsc(pluginOptions.rsc),
        tanstackStart(pluginOptions.tanstackStart),
        viteReact(pluginOptions.react),
      ],
      resolve: {
        alias: {
          '#cloudflare-runtime': path.resolve(
            __dirname,
            useCloudflareRuntime ? 'src/runtime/cloudflare.ts' : 'src/runtime/node.ts',
          ),
          '@/': `${path.resolve(__dirname, 'src')}/`,
        },
      },
      server: {
        port: 3000,
        warmup: {
          clientFiles: [
            './src/app/__root.tsx',
            './src/app/_payload.tsx',
            './src/app/_payload/admin.index.tsx',
            './src/app/_payload/admin.$.tsx',
          ],
        },
      },
    }
  },
  {
    devServerExternalPackages: ['esbuild', 'undici', 'wrangler', 'ws'],
    payloadConfigPath: path.resolve(__dirname, 'src', 'payload.config.ts'),
  },
)

export default defineConfig((env) => {
  const config = payloadConfig(env)
  const useCloudflareRuntime = env.command === 'build' || process.env.CLOUDFLARE_RUNTIME === 'true'

  if (useCloudflareRuntime) {
    if (config.ssr) {
      delete config.ssr.external
    }

    for (const name of ['rsc', 'ssr'] as const) {
      const environment = config.environments?.[name]
      // Workerd cannot resolve bare npm imports from generated chunks, so both
      // server environments must bundle the package boundaries Payload normally
      // leaves for Node's module loader.
      if (environment?.build?.rollupOptions) {
        delete environment.build.rollupOptions.external
      }
      if (environment?.resolve) {
        delete environment.resolve.external
      }
    }
  }

  return config
})
