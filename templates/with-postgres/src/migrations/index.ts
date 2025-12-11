import * as migration_20251211_224759_initial from './20251211_224759_initial'

export const migrations = [
  {
    up: migration_20251211_224759_initial.up,
    down: migration_20251211_224759_initial.down,
    name: '20251211_224759_initial',
  },
]
