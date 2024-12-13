import * as migration_20241211_181841_initial from './20241211_181841_initial'

export const migrations = [
  {
    up: migration_20241211_181841_initial.up,
    down: migration_20241211_181841_initial.down,
    name: '20241211_181841_initial',
  },
]
