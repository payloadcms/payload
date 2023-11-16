module.exports = {
  verbose: true,
  git: {
    requireCleanWorkingDir: false,
    commit: false,
    push: false,
    tag: false,
  },
  npm: {
    skipChecks: true,
    tag: 'beta',
  },
  hooks: {
    'before:init': ['pnpm install', 'pnpm clean', 'pnpm build'],
  },
}
