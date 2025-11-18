import type { StorybookConfig } from '@storybook/nextjs-vite'

import { dirname, resolve } from 'path'

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  typescript: {
    // Use react-docgen instead of react-docgen-typescript to avoid tsconfig scanning issues
    reactDocgen: 'react-docgen',
    // Disable type checking to avoid scanning examples directory
    check: false,
  },
  addons: [getAbsolutePath('@storybook/addon-docs'), getAbsolutePath('@storybook/addon-a11y')],
  framework: {
    name: getAbsolutePath('@storybook/nextjs-vite'),
    options: {},
  },
  staticDirs: ['./public'],
  viteFinal: async (config) => {
    // Configure vite-tsconfig-paths plugin to ignore config errors
    const tsconfigPathsPlugin = config.plugins?.find(
      (plugin: any) => plugin && plugin.name === 'vite-tsconfig-paths',
    )

    if (tsconfigPathsPlugin && typeof tsconfigPathsPlugin === 'object') {
      // Try to inject ignoreConfigErrors into the plugin's config
      ;(tsconfigPathsPlugin as any).ignoreConfigErrors = true
      if ((tsconfigPathsPlugin as any).api) {
        ;(tsconfigPathsPlugin as any).api.ignoreConfigErrors = true
      }
    }

    // Configure react-docgen plugin
    config.plugins = config.plugins?.map((plugin: any) => {
      if (plugin.name === 'storybook:react-docgen-plugin') {
        plugin.include = (id: string) => {
          // Skip the problematic Config provider file
          if (id.includes('packages/ui/src/providers/Config/index.tsx')) {
            return false
          }
          // Skip large generated files and node_modules
          if (id.includes('node_modules') || id.includes('.d.ts')) {
            return false
          }
          return /\.(tsx?)$/.test(id)
        }
      }
      return plugin
    })

    // Add basic path aliases for monorepo
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      // Basic aliases (updated paths for workspace)
      '@payloadcms/ui': resolve(__dirname, '../../packages/ui/src/exports/client/index.ts'),
      '@payloadcms/ui/elements/*': resolve(__dirname, '../../packages/ui/src/elements/*/index.tsx'),
      '@payloadcms/ui/icons/*': resolve(__dirname, '../../packages/ui/src/icons/*/index.tsx'),
      '@payloadcms/ui/fields/*': resolve(__dirname, '../../packages/ui/src/fields/*/index.tsx'),
      // Mock Next.js modules for Storybook - these MUST come first to override
      'next/navigation': resolve(__dirname, '../stories/_mocks/next-navigation.jsx'),
      'next/navigation.js': resolve(__dirname, '../stories/_mocks/next-navigation.jsx'),
      'next/link': resolve(__dirname, '../stories/_mocks/next-link.jsx'),
      'next/link.js': resolve(__dirname, '../stories/_mocks/next-link.jsx'),
    }

    // Ensure alias resolution takes priority
    config.resolve.preferRelative = false
    config.resolve.mainFields = ['browser', 'module', 'main']
    config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js']

    // Add to module resolution
    config.resolve.modules = [
      resolve(__dirname, '../stories/_mocks'),
      ...(config.resolve.modules || []),
      'node_modules',
    ]

    // Add SCSS support
    const { mergeConfig } = await import('vite')
    return mergeConfig(config, {
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern-compiler',
            silenceDeprecations: [
              'legacy-js-api',
              'import',
              'global-builtin',
              'mixed-decls',
              'color-functions',
              'slash-div',
            ],
            quietDeps: true,
            verbose: false,
            logger: {
              warn: () => {}, // Silence all SCSS warnings
              debug: () => {},
            },
            additionalData: `
              @import "${resolve(__dirname, '../../packages/ui/src/scss/vars.scss')}";
              @import "${resolve(__dirname, '../../packages/ui/src/scss/colors.scss')}";
              @import "${resolve(__dirname, '../../packages/ui/src/scss/queries.scss')}";
            `,
          },
        },
      },
    })
  },
}
export default config
