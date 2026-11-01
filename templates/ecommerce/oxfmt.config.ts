import type { OxfmtConfig } from 'oxfmt'

export default {
  ignorePatterns: [
    '.vercel',
    '.next',
    'pnpm-lock.yaml',
    '**/payload-types.ts',
    '.tmp',
    '**/.git',
    '**/.hg',
    '**/.pnp.*',
    '**/.svn',
    '**/.yarn/**',
    '**/build',
    '**/dist/**',
    '**/node_modules',
    '**/temp',
    '**/docs/**',
    'tsconfig.json',
  ],
  printWidth: 100,
  semi: false,
  singleQuote: true,
  sortPackageJson: false,
  trailingComma: 'all',
} satisfies OxfmtConfig
