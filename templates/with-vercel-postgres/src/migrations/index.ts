import * as migration_20251211_224720_initial from './20251211_224720_initial'

export const migrations = [
  {
    up: migration_20251211_224720_initial.up,
    down: migration_20251211_224720_initial.down,
    name: '20251211_224720_initial',
  },
]
