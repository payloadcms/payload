import type { OxfmtConfig } from 'oxfmt'

export default {
  ignorePatterns: [
    'src/app/_payload/importMap.js',
    'src/payload-types.ts',
    'src/routeTree.gen.ts',
    'tsconfig.json',
  ],
  printWidth: 100,
  semi: false,
  singleQuote: true,
  sortPackageJson: false,
  trailingComma: 'all',
} satisfies OxfmtConfig
