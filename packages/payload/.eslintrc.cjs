module.exports = {
  extends: ['@payloadcms'],
  ignorePatterns: ['**/payload-types.ts'],
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      files: [
        '*.js',
        '*.cjs',
        'playwright.config.ts',
        'playwright.bail.config.ts',
        'bin-cks.cjs',
        'bin-esm.mjs',
        'esm-loader.mjs',
        'esm-loader-playwright.mjs',
        '*.json',
        '*.md',
        '*.yml',
        '*.yaml',
      ],
    },
    {
      files: ['*.e2e.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'jest/expect-expect': 'off',
      },
    },
  ],
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  root: true,
}
