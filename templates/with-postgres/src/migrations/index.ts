import * as migration_20260322_233123_initial from './20260322_233123_initial'

export const migrations = [
  {
    up: migration_20260322_233123_initial.up,
    down: migration_20260322_233123_initial.down,
    name: '20260322_233123_initial',
  },
]
