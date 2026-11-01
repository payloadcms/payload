import type { OxfmtConfig } from 'oxfmt'

export default {
  ignorePatterns: ['**/payload-types.ts', 'tsconfig.json'],
  printWidth: 100,
  semi: false,
  singleQuote: true,
  sortPackageJson: false,
  trailingComma: 'all',
} satisfies OxfmtConfig
