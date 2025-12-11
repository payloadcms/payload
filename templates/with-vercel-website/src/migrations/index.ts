import * as migration_20251211_224740_initial from './20251211_224740_initial'

export const migrations = [
  {
    up: migration_20251211_224740_initial.up,
    down: migration_20251211_224740_initial.down,
    name: '20251211_224740_initial',
  },
]
