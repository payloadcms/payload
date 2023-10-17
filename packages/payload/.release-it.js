module.exports = {
  verbose: true,
  git: {
    commitMessage: 'chore(release): v${version}',
    requireCleanWorkingDir: false,
    tagMatch: 'v*', // payload is tagged normally, other packages are tagged with a prefix
  },
  github: {
    release: true,
  },
  npm: {
    skipChecks: true,
  },
  hooks: {
    'before:init': ['pnpm install', 'pnpm clean', 'pnpm build'], // Assume tests have already been run
  },
  plugins: {
    '@release-it/conventional-changelog': {
      infile: '../../CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: [
          { type: 'feat', section: 'Features' },
          { type: 'feature', section: 'Features' },
          { type: 'fix', section: 'Bug Fixes' },
          { type: 'docs', section: 'Documentation' },
        ],
      },
      writerOpts: {
        commitGroupsSort: (a, b) => {
          const groupOrder = ['Features', 'Bug Fixes', 'Documentation']
          return groupOrder.indexOf(a.title) - groupOrder.indexOf(b.title)
        },

        // Scoped commits at the end, alphabetical sort
        commitsSort: (a, b) => {
          if (a.scope || b.scope) {
            if (!a.scope) return -1
            if (!b.scope) return 1
            return a.scope === b.scope
              ? a.subject.localeCompare(b.subject)
              : a.scope.localeCompare(b.scope)
          }

          // Alphabetical sort
          return a.subject.localeCompare(b.subject)
        },
      },
    },
  },
}
