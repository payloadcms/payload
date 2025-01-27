module.exports = {
  // gitRawCommitsOpts: {
  //   from: 'v2.0.9',
  //   path: 'packages/payload',
  // },
  // infile: 'CHANGELOG.md',
  options: {
    preset: {
      name: 'conventionalcommits',
      types: [
        { section: 'Features', type: 'feat' },
        { section: 'Features', type: 'feature' },
        { section: 'Bug Fixes', type: 'fix' },
        { section: 'Documentation', type: 'docs' },
      ],
    },
  },
  // outfile: 'NEW.md',
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
}
