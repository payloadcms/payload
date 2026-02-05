import * as migration_20260205_181728_initial from './20260205_181728_initial'

export const migrations = [
  {
    up: migration_20260205_181728_initial.up,
    down: migration_20260205_181728_initial.down,
    name: '20260205_181728_initial',
  },
]
