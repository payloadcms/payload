import type { StorybookConfig } from '@storybook/react-vite'

import { join, dirname } from 'path'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-onboarding'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  viteFinal: async (config) => {
    // Set environment variable for Babel configuration
    process.env.STORYBOOK = 'true'

    // Suppress Sass deprecation warnings via environment variables
    process.env.SASS_SILENCE_DEPRECATIONS = 'legacy-js-api'
    process.env.SASS_QUIET_DEPS = 'true'

    // Define process global for Next.js compatibility
    config.define = {
      ...config.define,
      'process.env': {
        ...process.env,
        SASS_SILENCE_DEPRECATIONS: 'legacy-js-api',
        SASS_QUIET_DEPS: 'true',
      },
      global: 'globalThis',
    }

    // Configure SCSS processing
    config.css = {
      ...config.css,
      preprocessorOptions: {
        ...config.css?.preprocessorOptions,
        scss: {
          ...config.css?.preprocessorOptions?.scss,
          quietDeps: true,
        },
      },
    }

    return config
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
}
export default config
