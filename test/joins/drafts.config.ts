import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { DraftJoinArticles } from './collections/DraftJoinArticles.js'
import { DraftJoinNotes } from './collections/DraftJoinNotes.js'
import { DraftJoinProjects } from './collections/DraftJoinProjects.js'
import { DraftJoinWorkspaces } from './collections/DraftJoinWorkspaces.js'

export default buildConfigWithDefaults({
  suite: 'polymorphic-join-drafts',
  config: {
    collections: [DraftJoinProjects, DraftJoinArticles, DraftJoinNotes, DraftJoinWorkspaces],
    localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
    typescript: { autoGenerate: false },
  },
})
