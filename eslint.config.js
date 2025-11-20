import payloadEsLintConfig from '@payloadcms/eslint-config'
import payloadPlugin from '@payloadcms/eslint-plugin'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/jest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
  'packages/**/*.spec.ts',
  'next-env.d.ts',
  '**/app',
  'src/**/*.spec.ts',
  '**/jest.setup.js',
  'packages/payload/rollup.dts.config.mjs',
]

/** @typedef {import('eslint').Linter.Config} Config */

export const rootParserOptions = {
  sourceType: 'module',
  ecmaVersion: 'latest',
  projectService: true,
}

/** @type {Config[]} */
export const rootEslintConfig = [
  ...payloadEsLintConfig,
  {
    ignores: [
      ...defaultESLintIgnores,
      'packages/eslint-*/**',
      'test/live-preview/next-app',
      'packages/**/*.spec.ts',
      'templates/**',
      'examples/**',
    ],
  },
  {
    plugins: {
      payload: payloadPlugin,
    },
    rules: {
      'payload/no-jsx-import-statements': 'warn',
      'payload/no-relative-monorepo-imports': 'error',
      'payload/no-imports-from-exports-dir': 'error',
      'payload/no-imports-from-self': [
        'error',
        {
          exclude: ['/server-externals$'],
        },
      ],
      'payload/proper-payload-logger-usage': 'error',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['tools/**/*.ts'],
    rules: {
      'no-console': 'off',
      'perfectionist/sort-object-types': 'off',
      'perfectionist/sort-objects': 'off',
      'payload/no-relative-monorepo-imports': 'off',
    },
  },
]

export default [
  ...rootEslintConfig,
  {
    files: ['packages/eslint-config/**/*.ts'],
    rules: {
      'perfectionist/sort-objects': 'off',
    },
  },
  {
    files: ['packages/payload-cloud/**/*.ts', 'packages/payload-cloud/**/*.tsx'],
    rules: {
      'payload/no-restricted-imports': [
        'error',
        {
          resolvePathsFrom: 'src/exports/server-externals.ts',
          restrictTypeImports: false,
          message:
            'Direct imports from server-externals packages are not allowed. Use type-only imports or import from @payloadcms/payload-cloud/server-externals instead.',
        },
      ],
    },
  },
  {
    files: ['packages/drizzle/**/*.ts', 'packages/drizzle/**/*.tsx'],
    rules: {
      // Note: @payloadcms/drizzle is not directly installed by users, so we allow direct imports here.
      // The heavy packages (drizzle-kit, drizzle-orm) are re-exported through db adapter server-externals.
      'payload/no-restricted-imports': 'off',
    },
  },
  {
    files: ['packages/db-mongodb/**/*.ts', 'packages/db-mongodb/**/*.tsx'],
    rules: {
      'payload/no-restricted-imports': [
        'error',
        {
          resolvePathsFrom: 'src/exports/server-externals.ts',
          restrictTypeImports: false,
          message:
            'Direct imports from server-externals packages are not allowed. Use type-only imports or import from @payloadcms/db-mongodb/server-externals instead.',
        },
      ],
    },
  },
  {
    files: ['packages/db-postgres/**/*.ts', 'packages/db-postgres/**/*.tsx'],
    rules: {
      'payload/no-restricted-imports': [
        'error',
        {
          resolvePathsFrom: 'src/exports/server-externals.ts',
          restrictTypeImports: false,
          message:
            'Direct imports from server-externals packages are not allowed. Use type-only imports or import from @payloadcms/db-postgres/server-externals instead.',
        },
      ],
    },
  },
  {
    files: ['packages/db-sqlite/**/*.ts', 'packages/db-sqlite/**/*.tsx'],
    rules: {
      'payload/no-restricted-imports': [
        'error',
        {
          resolvePathsFrom: 'src/exports/server-externals.ts',
          restrictTypeImports: false,
          message:
            'Direct imports from server-externals packages are not allowed. Use type-only imports or import from @payloadcms/db-sqlite/server-externals instead.',
        },
      ],
    },
  },
  {
    files: ['packages/db-vercel-postgres/**/*.ts', 'packages/db-vercel-postgres/**/*.tsx'],
    rules: {
      'payload/no-restricted-imports': [
        'error',
        {
          resolvePathsFrom: 'src/exports/server-externals.ts',
          restrictTypeImports: false,
          message:
            'Direct imports from server-externals packages are not allowed. Use type-only imports or import from @payloadcms/db-vercel-postgres/server-externals instead.',
        },
      ],
    },
  },
  {
    files: ['packages/db-d1-sqlite/**/*.ts', 'packages/db-d1-sqlite/**/*.tsx'],
    rules: {
      'payload/no-restricted-imports': [
        'error',
        {
          resolvePathsFrom: 'src/exports/server-externals.ts',
          restrictTypeImports: false,
          message:
            'Direct imports from server-externals packages are not allowed. Use type-only imports or import from @payloadcms/db-d1-sqlite/server-externals instead.',
        },
      ],
    },
  },
  {
    files: ['templates/vercel-postgres/**'],
    rules: {
      'no-restricted-exports': 'off',
    },
  },
]
